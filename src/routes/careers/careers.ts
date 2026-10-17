import { Router, Request, Response, NextFunction } from "express";
import { Prisma, TestType, TestResult } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  verifyAccessToken,
  JwtPayload,
} from "../../middleware/auth.middleware";

const router = Router();

function isTestType(value: unknown): value is TestType {
  return Object.values(TestType).includes(value as TestType);
}

function isTestResult(value: unknown): value is TestResult {
  return Object.values(TestResult).includes(value as TestResult);
}

type TestSubject = {
  subjectName: string;
  subjectScore: number;
};

function parseTestDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidSubjects(value: unknown): value is TestSubject[] {
  return (
    Array.isArray(value) &&
    value.every(
      (subject) =>
        subject &&
        typeof subject.subjectName === "string" &&
        subject.subjectName.trim() !== "" &&
        isFiniteNumber(subject.subjectScore) &&
        subject.subjectScore >= 0 &&
        subject.subjectScore <= 100,
    )
  );
}

// Mean rounded to 2 decimals; null when there is nothing to average
function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(mean * 100) / 100;
}

const testOrder = { testType: "asc" } as const;

// Fields sent to the frontend for each test; ids/timestamps stay internal and
// testType becomes the key in the tests object
const testSelect = {
  testType: true,
  testDate: true,
  subjects: true,
  score: true,
  status: true,
  evaluatedBy: true,
} satisfies Prisma.JobApplicationTestSelect;

type TestRow = Prisma.JobApplicationTestGetPayload<{
  select: typeof testSelect;
}>;
type TestView = Omit<TestRow, "testType">;
type TestsView = Record<TestType, TestView | null>;
type OverallView = { score: number | null; status: TestResult | null };

// Overall result across the assigned tests: any fail/absent fails it, all
// passed passes it, anything else is not decided yet (null). No tests -> null.
function getOverall(tests: TestRow[]): OverallView {
  if (tests.length === 0) return { score: null, status: null };

  const score = averageOf(
    tests
      .map((test) => test.score)
      .filter((score): score is number => isFiniteNumber(score)),
  );

  let status: TestResult | null = null;
  if (
    tests.some(
      (t) => t.status === TestResult.fail || t.status === TestResult.absent,
    )
  ) {
    status = TestResult.fail;
  } else if (tests.every((t) => t.status === TestResult.pass)) {
    status = TestResult.pass;
  }

  return { score, status };
}

// Array of test rows -> { written, technical, interview } (null = not assigned)
// plus the overall result. `onlyType` limits the tests object to one tab.
function formatTests(tests: TestRow[], onlyType?: TestType) {
  const view = Object.fromEntries(
    Object.values(TestType).map((type) => [type, null]),
  ) as TestsView;

  for (const { testType, ...test } of tests) {
    if (!onlyType || testType === onlyType) view[testType] = test;
  }

  return { tests: view, overall: getOverall(tests) };
}

const TEST_STAGE = "test";
const OVERALL_STATUS = "overall";

function isPositiveIntArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => Number.isInteger(v) && v > 0)
  );
}

type ApplicantFilters = {
  keyword?: unknown;
  status?: unknown;
  stage?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  divisionId?: unknown;
  universityId?: unknown;
};

// Query strings send numbers as strings, JSON bodies as numbers
function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "string" || typeof value === "number"
    ? Number(value)
    : undefined;
}

// Applicant list filters for one career, shared by the list endpoint (query
// string) and bulk "select all" actions (body) so both match the same rows.
// testTab is set when a single test type tab is selected in the test stage.
function buildApplicantWhere(
  careerId: number,
  filters: ApplicantFilters,
):
  | { where: Prisma.JobApplicationWhereInput; testTab?: TestType }
  | { error: string } {
  const {
    keyword,
    status,
    stage,
    startDate,
    endDate,
    divisionId,
    universityId,
  } = filters;

  const keywordStr =
    typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
  const stageStr = typeof stage === "string" ? stage : undefined;
  const statusStr = typeof status === "string" ? status : undefined;
  const startDateStr = typeof startDate === "string" ? startDate : undefined;
  const endDateStr = typeof endDate === "string" ? endDate : undefined;
  const divisionIdNum = toOptionalNumber(divisionId);
  const universityIdNum = toOptionalNumber(universityId);

  const where: Prisma.JobApplicationWhereInput = { jobId: careerId };

  if (stageStr) {
    where.stage = stageStr;
  }

  // In the test stage, "status" is a test type tab (or "overall") and is
  // resolved against the assigned test rows, not JobApplication.status
  let testTab: TestType | undefined;
  if (stageStr === TEST_STAGE) {
    if (!statusStr || statusStr === OVERALL_STATUS) {
      // "overall" is not a status: anyone with at least one of the tests
      where.tests = { some: {} };
    } else if (isTestType(statusStr)) {
      where.tests = { some: { testType: statusStr } };
      testTab = statusStr;
    } else {
      return {
        error: `Invalid status for test stage. Allowed: ${[...Object.values(TestType), OVERALL_STATUS].join(", ")}`,
      };
    }
  } else if (statusStr) {
    where.status = statusStr;
  }

  const applicantFilters: Prisma.ApplicantWhereInput = {};

  if (keywordStr) {
    applicantFilters.name = { contains: keywordStr, mode: "insensitive" };
  }

  if (universityIdNum) {
    applicantFilters.universityId = universityIdNum;
  }

  if (divisionIdNum) {
    applicantFilters.divisionId = divisionIdNum;
  }

  if (Object.keys(applicantFilters).length > 0) {
    where.applicant = applicantFilters;
  }

  if (startDateStr || endDateStr) {
    where.appliedOn = {
      ...(startDateStr && { gte: new Date(startDateStr) }),
      ...(endDateStr && { lte: new Date(endDateStr) }),
    };
  }

  return { where, testTab };
}

// Remarks fields sent to the frontend alongside the application
const remarksSelect = {
  remarks: true,
  remarksAt: true,
  remarksBy: true,
} satisfies Prisma.JobApplicationSelect;

// Remarks with who changed them and when. Blank text clears all three, and
// resending the current text leaves them untouched so remarksAt doesn't move.
function buildRemarksData(
  remarks: string | null,
  current: string | null,
  username?: string,
) {
  const value = remarks?.trim() || null;
  if (value === current) return {};
  return {
    remarks: value,
    remarksAt: value ? new Date() : null,
    remarksBy: value ? (username ?? null) : null,
  };
}

type BulkError = { status: number; message: string };

// Turns a bulk applicant payload into the rows it targets. Two modes:
// - manual (isSelectAll=false): only the applicationIds in modifiedFields,
//   all of which must belong to the career (404 otherwise)
// - select all (isSelectAll=true): every applicant matching the list filters
//   sent in the body, except excludedIds
// Returns the action's `data` object alongside the where clause.
async function resolveBulkApplicants(
  careerId: number,
  body: any,
): Promise<{ where: Prisma.JobApplicationWhereInput; data: any } | BulkError> {
  const { isSelectAll, modifiedFields, excludedIds, data, ...filters } =
    body ?? {};

  if (typeof isSelectAll !== "boolean") {
    return { status: 400, message: "isSelectAll must be a boolean" };
  }

  // jobId is repeated in the body; it must not point at another career
  if (
    [filters.jobId, data?.jobId].some(
      (jobId) => jobId !== undefined && Number(jobId) !== careerId,
    )
  ) {
    return { status: 400, message: "jobId does not match the career ID" };
  }

  if (isSelectAll) {
    if (
      excludedIds !== undefined &&
      excludedIds !== null &&
      !(
        Array.isArray(excludedIds) &&
        (excludedIds.length === 0 || isPositiveIntArray(excludedIds))
      )
    ) {
      return {
        status: 400,
        message: "excludedIds must be an array of application IDs",
      };
    }

    const filter = buildApplicantWhere(careerId, filters);
    if ("error" in filter) return { status: 400, message: filter.error };

    const where = filter.where;
    if (excludedIds?.length) {
      where.applicationId = { notIn: [...new Set<number>(excludedIds)] };
    }
    return { where, data };
  }

  const applicationIds = Array.isArray(modifiedFields)
    ? modifiedFields.map((field) => field?.applicationId)
    : [];

  if (!isPositiveIntArray(applicationIds)) {
    return {
      status: 400,
      message: "modifiedFields must be a non-empty array of { applicationId }",
    };
  }

  const uniqueIds = [...new Set(applicationIds)];
  const where = { applicationId: { in: uniqueIds }, jobId: careerId };

  const matched = await prisma.jobApplication.count({ where });
  if (matched !== uniqueIds.length) {
    return {
      status: 404,
      message: "One or more applicants not found for this career",
    };
  }
  return { where, data };
}

// Values match the frontend StageTypeT / StatusTypeT
const APPLICANT_STAGES = [
  "submittedCv",
  "shortlisted",
  TEST_STAGE,
  "finalSelection",
  "rejected",
];
const APPLICANT_STATUSES = [
  "newCv",
  "viewed",
  "notViewed",
  "onboarded",
  "notMovingForward",
];

type StageInput = {
  stage: string;
  status: string | null;
  testTypes: TestType[];
};

// Validates a stage move (frontend StageChangeT). For the test stage, status
// is the array of test types to assign; for other stages it is an optional
// status value.
function parseStageInput(input: any): StageInput | { error: string } {
  const { stage, status } = input ?? {};

  if (!APPLICANT_STAGES.includes(stage)) {
    return { error: `Invalid stage. Allowed: ${APPLICANT_STAGES.join(", ")}` };
  }

  if (stage === TEST_STAGE) {
    if (
      !Array.isArray(status) ||
      status.length === 0 ||
      !status.every(isTestType)
    ) {
      return {
        error: `status must be a non-empty array of test types for the test stage. Allowed: ${Object.values(TestType).join(", ")}`,
      };
    }

    return {
      stage,
      // Test-stage status lives on the test rows, so the column is cleared
      status: null,
      testTypes: [...new Set(status as TestType[])],
    };
  }

  if (
    status !== undefined &&
    status !== null &&
    !APPLICANT_STATUSES.includes(status)
  ) {
    return {
      error: `Invalid status. Allowed: ${APPLICANT_STATUSES.join(", ")}`,
    };
  }

  return { stage, status: status ?? null, testTypes: [] };
}

// Moves applications to a stage. For the test stage, each selected test type
// is assigned by creating a pending test row; existing rows (and their
// scores) are kept and only new types are added.
async function moveApplicantsToStage(
  careerId: number,
  where: Prisma.JobApplicationWhereInput,
  { stage, status, testTypes }: StageInput,
) {
  return prisma.$transaction(async (tx) => {
    // Test rows are created per application, so the IDs are resolved first;
    // only applications of this career are touched, test rows included
    const ids = (
      await tx.jobApplication.findMany({
        where: { AND: [where, { jobId: careerId }] },
        select: { applicationId: true },
      })
    ).map((row) => row.applicationId);
    if (ids.length === 0) return 0;

    const { count } = await tx.jobApplication.updateMany({
      where: { applicationId: { in: ids } },
      data: { stage, status },
    });

    if (testTypes.length > 0) {
      await tx.jobApplicationTest.createMany({
        data: ids.flatMap((applicationId) =>
          testTypes.map((testType) => ({ applicationId, testType })),
        ),
        skipDuplicates: true,
      });
    }

    return count;
  });
}

const CAREER_STATUSES = ["Y", "N"];

// Optional free-text career fields: blank is saved as null
const CAREER_TEXT_FIELDS = [
  "position",
  "experience",
  "salary",
  "location",
  "email",
  "context",
  "requirements",
  "additionalRequirements",
  "skills",
  "qualifications",
  "benefits",
] as const;

// Keys kept from the SEO tag objects; anything else is dropped
const META_TAG_KEYS = ["metaTitle", "metaKeywords", "metaDescription"];
const OG_TAG_KEYS = ["ogType", "ogTitle", "ogDescription", "ogImage"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// SEO tag object -> JSON with only the known string keys; null clears it
function parseTagObject(
  value: unknown,
  keys: string[],
): Record<string, string | null> | typeof Prisma.DbNull | undefined | false {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  if (typeof value !== "object" || Array.isArray(value)) return false;

  const tags: Record<string, string | null> = {};
  for (const key of keys) {
    const tag = (value as Record<string, unknown>)[key];
    if (tag === undefined) continue;
    if (tag !== null && typeof tag !== "string") return false;
    tags[key] = tag?.trim() || null;
  }
  return tags;
}

// Validates a create/update career body. Only fields present in the body are
// returned, so an update leaves the rest untouched; jobTitle is required when
// creating. Counters (applicants, viewed, ...) are never taken from the body.
function parseCareerInput(
  body: any,
  { isCreate }: { isCreate: boolean },
): Prisma.CareerUncheckedUpdateInput | { error: string } {
  const input = body ?? {};
  const data: Prisma.CareerUncheckedUpdateInput = {};

  if (input.jobTitle !== undefined || isCreate) {
    if (typeof input.jobTitle !== "string" || input.jobTitle.trim() === "") {
      return { error: "jobTitle is required" };
    }
    data.jobTitle = input.jobTitle.trim();
  }

  if (input.slug !== undefined && input.slug !== null) {
    if (typeof input.slug !== "string") return { error: "Invalid slug format" };
    data.slug = slugify(input.slug) || null;
  } else if (input.slug === null) {
    data.slug = null;
  }

  for (const field of CAREER_TEXT_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (value !== null && typeof value !== "string") {
      return { error: `Invalid ${field} format` };
    }
    data[field] = value?.trim() || null;
  }

  if (
    typeof data.email === "string" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    return { error: "Invalid email format" };
  }

  // Existence is checked against the departments table by the caller
  if (input.departmentId !== undefined) {
    const departmentId =
      input.departmentId === null ? null : Number(input.departmentId);
    if (
      departmentId !== null &&
      !(Number.isInteger(departmentId) && departmentId > 0)
    ) {
      return { error: "Invalid departmentId" };
    }
    data.departmentId = departmentId;
  }

  if (input.vacancy !== undefined) {
    const vacancy = input.vacancy === null ? null : Number(input.vacancy);
    if (vacancy !== null && !(Number.isInteger(vacancy) && vacancy >= 0)) {
      return { error: "vacancy must be a whole number of 0 or more" };
    }
    data.vacancy = vacancy;
  }

  if (input.deadline !== undefined) {
    const deadline = parseTestDate(input.deadline);
    if (deadline === undefined) return { error: "Invalid deadline format" };
    data.deadline = deadline;
  }

  if (input.status !== undefined || isCreate) {
    const status = input.status ?? "Y";
    if (!CAREER_STATUSES.includes(status)) {
      return { error: `Invalid status. Allowed: ${CAREER_STATUSES.join(", ")}` };
    }
    data.status = status;
  }

  const metaTag = parseTagObject(input.metaTag, META_TAG_KEYS);
  if (metaTag === false) return { error: "Invalid metaTag format" };
  if (metaTag !== undefined) data.metaTag = metaTag;

  const ogTag = parseTagObject(input.ogTag, OG_TAG_KEYS);
  if (ogTag === false) return { error: "Invalid ogTag format" };
  if (ogTag !== undefined) data.ogTag = ogTag;

  return data;
}

// A job may only point at a department that exists
async function isDepartmentMissing(departmentId: unknown) {
  if (typeof departmentId !== "number") return false;
  const department = await prisma.department.findUnique({
    where: { departmentId },
    select: { departmentId: true },
  });
  return !department;
}

// Careers are returned with a flat departmentName (frontend CareerT) instead
// of the nested department relation
const careerInclude = {
  department: { select: { departmentName: true } },
} satisfies Prisma.CareerInclude;

function withDepartmentName({
  department,
  ...career
}: Prisma.CareerGetPayload<{ include: typeof careerInclude }>) {
  return { ...career, departmentName: department?.departmentName ?? null };
}

// Slugs are used in public job URLs, so no two jobs may share one
async function isSlugTaken(slug: string, exceptJobId?: number) {
  const existing = await prisma.career.findFirst({
    where: { slug, ...(exceptJobId && { jobId: { not: exceptJobId } }) },
    select: { jobId: true },
  });
  return existing !== null;
}

type CareerFilters = {
  keyword?: unknown;
  departmentId?: unknown;
  status?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

// Career list filters, shared by the list endpoint (query string) and the
// bulk status "select all" mode (body) so both match the same rows
function buildCareerWhere(filters: CareerFilters): Prisma.CareerWhereInput {
  const { keyword, departmentId, status, startDate, endDate } = filters;

  const keywordStr =
    typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
  const departmentIdNum =
    typeof departmentId === "string" || typeof departmentId === "number"
      ? Number(departmentId)
      : undefined;
  const startDateStr = typeof startDate === "string" ? startDate : undefined;
  const endDateStr = typeof endDate === "string" ? endDate : undefined;
  const statusStr = typeof status === "string" ? status : undefined;

  const where: Prisma.CareerWhereInput = {};
  if (keywordStr) {
    where.jobTitle = { contains: keywordStr, mode: "insensitive" };
  }
  if (departmentIdNum) {
    where.departmentId = departmentIdNum;
  }
  if (statusStr) {
    where.status = statusStr;
  }
  if (startDateStr || endDateStr) {
    where.deadline = {
      ...(startDateStr && { gte: new Date(startDateStr) }),
      ...(endDateStr && { lte: new Date(endDateStr) }),
    };
  }
  return where;
}

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemsPerPage, currentPage } = req.query;
      const where = buildCareerWhere(req.query);

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.career.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Careers retrieved successfully",
          data: [],
          pagination: {
            currentPage: 0,
            itemsPerPage: perPage,
            totalPages: 0,
            totalItems: 0,
          },
        });
      }

      const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
      const currentPageNumber = Math.min(Math.max(page, 1), totalPages || 1);
      const skip = (currentPageNumber - 1) * perPage;

      const careers = await prisma.career.findMany({
        where,
        include: careerInclude,
        orderBy: { jobId: "desc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Careers retrieved successfully",
        data: careers.map(withDepartmentName),
        pagination: {
          currentPage: currentPageNumber,
          itemsPerPage: perPage,
          totalPages,
          totalItems,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const careerIdNum = Number(id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const career = await prisma.career.findUnique({
        where: { jobId: careerIdNum },
        include: careerInclude,
      });

      if (!career) {
        return res.status(404).json({
          success: false,
          message: "Career not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Career retrieved successfully",
        data: withDepartmentName(career),
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Create a career/job post. A missing slug is generated from jobTitle.
router.post(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = parseCareerInput(req.body, { isCreate: true });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      if (await isDepartmentMissing(data.departmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid departmentId" });
      }

      data.slug ??= slugify(data.jobTitle as string) || null;
      if (typeof data.slug === "string" && (await isSlugTaken(data.slug))) {
        return res.status(409).json({
          success: false,
          message: `Slug "${data.slug}" is already used by another job`,
        });
      }

      const career = await prisma.career.create({
        data: data as Prisma.CareerUncheckedCreateInput,
        include: careerInclude,
      });

      return res.status(201).json({
        success: true,
        message: "Career created successfully",
        data: withDepartmentName(career),
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Update a career/job post. Fields left out of the body are unchanged.
router.put(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const data = parseCareerInput(req.body, { isCreate: false });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      const existing = await prisma.career.findUnique({
        where: { jobId: careerIdNum },
        select: { jobTitle: true },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Career not found",
        });
      }

      if (await isDepartmentMissing(data.departmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid departmentId" });
      }

      // A blank slug is regenerated from the (new or current) title
      if ("slug" in data && data.slug === null) {
        data.slug =
          slugify((data.jobTitle as string) ?? existing.jobTitle) || null;
      }
      if (
        typeof data.slug === "string" &&
        (await isSlugTaken(data.slug, careerIdNum))
      ) {
        return res.status(409).json({
          success: false,
          message: `Slug "${data.slug}" is already used by another job`,
        });
      }

      const career = await prisma.career.update({
        where: { jobId: careerIdNum },
        data,
        include: careerInclude,
      });

      return res.status(200).json({
        success: true,
        message: "Career updated successfully",
        data: withDepartmentName(career),
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Bulk status change for career/job posts. Two modes:
// - manual (isSelectAll=false): only the jobIds in modifiedFields
// - select all (isSelectAll=true): every job matching the list filters sent
//   in the body, except excludedIds
router.patch(
  "/status",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isSelectAll, modifiedFields, excludedIds, data, ...filters } =
        req.body ?? {};
      const status = data?.status;

      if (typeof isSelectAll !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isSelectAll must be a boolean",
        });
      }

      if (!CAREER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid data.status. Allowed: ${CAREER_STATUSES.join(", ")}`,
        });
      }

      let where: Prisma.CareerWhereInput;
      if (isSelectAll) {
        if (
          excludedIds !== undefined &&
          excludedIds !== null &&
          !(
            Array.isArray(excludedIds) &&
            (excludedIds.length === 0 || isPositiveIntArray(excludedIds))
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "excludedIds must be an array of job IDs",
          });
        }

        where = buildCareerWhere(filters);
        if (excludedIds?.length) {
          where.jobId = { notIn: [...new Set<number>(excludedIds)] };
        }
      } else {
        const jobIds = Array.isArray(modifiedFields)
          ? modifiedFields.map((field) => field?.jobId)
          : [];

        if (!isPositiveIntArray(jobIds)) {
          return res.status(400).json({
            success: false,
            message: "modifiedFields must be a non-empty array of { jobId }",
          });
        }

        where = { jobId: { in: [...new Set(jobIds)] } };
      }

      const { count } = await prisma.career.updateMany({
        where,
        data: { status },
      });

      return res.status(200).json({
        success: true,
        message: `${count} job(s) status updated successfully`,
        data: { updatedCount: count, status },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Status change for a single career/job post; returns the updated job
router.patch(
  "/:id/status",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const { status } = req.body ?? {};
      if (!CAREER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${CAREER_STATUSES.join(", ")}`,
        });
      }

      // updateMany so a missing job is a 404 rather than a thrown error
      const { count } = await prisma.career.updateMany({
        where: { jobId: careerIdNum },
        data: { status },
      });
      if (count === 0) {
        return res.status(404).json({
          success: false,
          message: "Career not found",
        });
      }

      const career = await prisma.career.findUnique({
        where: { jobId: careerIdNum },
      });

      return res.status(200).json({
        success: true,
        message: "Job status updated successfully",
        data: career,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id/applicants",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const careerIdNum = Number(id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Job ID",
        });
      }

      const { stage, status, itemsPerPage, currentPage } = req.query;
      const stageStr = typeof stage === "string" ? stage : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const filter = buildApplicantWhere(careerIdNum, req.query);
      if ("error" in filter) {
        return res.status(400).json({ success: false, message: filter.error });
      }
      const { where, testTab } = filter;

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.jobApplication.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Applicants retrieved successfully",
          data: [],
          pagination: {
            currentPage: 0,
            itemsPerPage: perPage,
            totalPages: 0,
            totalItems: 0,
          },
        });
      }

      const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
      const currentPageNumber = Math.min(Math.max(page, 1), totalPages || 1);
      const skip = (currentPageNumber - 1) * perPage;

      const data = await prisma.jobApplication.findMany({
        where,
        include: {
          applicant: true,
          // All tests are loaded so overall is correct even on a single-test tab
          tests: { select: testSelect, orderBy: testOrder },
        },
        orderBy: { applicationId: "asc" },
        skip,
        take: perPage,
      });

      // Test-stage status isn't stored on the application; echo the requested
      // tab (a test type or "overall") so the frontend still gets a root status
      const testTabStatus =
        stageStr === TEST_STAGE ? (statusStr ?? OVERALL_STATUS) : undefined;
      const response = data.map(({ tests, ...application }) => ({
        ...application,
        ...(testTabStatus && { status: testTabStatus }),
        ...formatTests(tests, testTab),
      }));

      return res.status(200).json({
        success: true,
        message: "Applicants retrieved successfully",
        data: response,
        pagination: {
          currentPage: currentPageNumber,
          itemsPerPage: perPage,
          totalPages,
          totalItems,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Bulk stage/status change for a career's applicants, manual or select-all
// (see resolveBulkApplicants). The new stage, status and testTypes are in
// `data`.
router.patch(
  "/:id/applicants/stage",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const target = await resolveBulkApplicants(careerIdNum, req.body);
      if ("message" in target) {
        return res
          .status(target.status)
          .json({ success: false, message: target.message });
      }

      const input = parseStageInput(target.data);
      if ("error" in input) {
        return res.status(400).json({ success: false, message: input.error });
      }

      const count = await moveApplicantsToStage(
        careerIdNum,
        target.where,
        input,
      );

      return res.status(200).json({
        success: true,
        message: `${count} applicant(s) moved to ${input.stage} successfully`,
        data: { updatedCount: count, stage: input.stage, status: input.status },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Stage/status change for a single applicant; returns the updated applicant
router.patch(
  "/:id/applicants/:applicationId/stage",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      const applicationIdNum = Number(req.params.applicationId);
      if (Number.isNaN(careerIdNum) || Number.isNaN(applicationIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID or applicant ID",
        });
      }

      // jobId/applicationId are repeated in the body; they must match the URL
      const { jobId, applicationId } = req.body ?? {};
      if (
        (jobId !== undefined && Number(jobId) !== careerIdNum) ||
        (applicationId !== undefined &&
          Number(applicationId) !== applicationIdNum)
      ) {
        return res.status(400).json({
          success: false,
          message: "jobId or applicationId does not match the URL",
        });
      }

      const input = parseStageInput(req.body);
      if ("error" in input) {
        return res.status(400).json({ success: false, message: input.error });
      }

      const count = await moveApplicantsToStage(
        careerIdNum,
        { applicationId: applicationIdNum },
        input,
      );
      if (count === 0) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found for this career",
        });
      }

      const { tests, ...application } =
        await prisma.jobApplication.findUniqueOrThrow({
          where: { applicationId: applicationIdNum },
          include: {
            applicant: true,
            tests: { select: testSelect, orderBy: testOrder },
          },
        });

      return res.status(200).json({
        success: true,
        message: `Applicant moved to ${input.stage} successfully`,
        data: {
          ...application,
          ...(application.stage === TEST_STAGE && { status: OVERALL_STATUS }),
          ...formatTests(tests),
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Bulk remarks for a career's applicants, manual or select-all (see
// resolveBulkApplicants). The new remarks are in `data`.
router.patch(
  "/:id/applicants/remarks",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      if (Number.isNaN(careerIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID",
        });
      }

      const target = await resolveBulkApplicants(careerIdNum, req.body);
      if ("message" in target) {
        return res
          .status(target.status)
          .json({ success: false, message: target.message });
      }
      const { where } = target;

      const remarks = target.data?.remarks;
      if (remarks !== null && typeof remarks !== "string") {
        return res.status(400).json({
          success: false,
          message: "data.remarks must be a string or null",
        });
      }

      // Same rules as the single remarks update: blank clears, and rows that
      // already have this text are skipped so their remarksAt doesn't move
      const value = remarks?.trim() || null;
      const user = (req as any).user as JwtPayload | undefined;
      const { count } = await prisma.jobApplication.updateMany({
        where: {
          AND: [
            where,
            value === null
              ? { remarks: { not: null } }
              : { OR: [{ remarks: null }, { remarks: { not: value } }] },
          ],
        },
        data: {
          remarks: value,
          remarksAt: value ? new Date() : null,
          remarksBy: value ? (user?.username ?? null) : null,
        },
      });

      return res.status(200).json({
        success: true,
        message: `Remarks updated for ${count} applicant(s) successfully`,
        data: { updatedCount: count, remarks: value },
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id/applicants/:applicationId",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      const applicationIdNum = Number(req.params.applicationId);
      if (Number.isNaN(careerIdNum) || Number.isNaN(applicationIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID or applicant ID",
        });
      }

      const application = await prisma.jobApplication.findUnique({
        where: {
          applicationId: applicationIdNum,
        },
        include: {
          applicant: true,
          tests: { select: testSelect, orderBy: testOrder },
        },
      });

      if (!application || application.jobId !== careerIdNum) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found for this career",
        });
      }

      // Always the full applicant with every test; tab filtering is only done
      // by the list endpoint
      const { tests, ...rest } = application;
      return res.status(200).json({
        success: true,
        message: "Applicant retrieved successfully",
        data: {
          ...rest,
          ...(rest.stage === TEST_STAGE && { status: OVERALL_STATUS }),
          ...formatTests(tests),
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id/applicants/:applicationId/tests",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      const applicationIdNum = Number(req.params.applicationId);
      if (Number.isNaN(careerIdNum) || Number.isNaN(applicationIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID or applicant ID",
        });
      }

      const application = await prisma.jobApplication.findFirst({
        where: { applicationId: applicationIdNum, jobId: careerIdNum },
        select: {
          applicationId: true,
          ...remarksSelect,
          tests: { select: testSelect, orderBy: testOrder },
        },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found for this career",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Applicant test results retrieved successfully",
        data: {
          applicationId: application.applicationId,
          remarks: application.remarks,
          remarksAt: application.remarksAt,
          remarksBy: application.remarksBy,
          ...formatTests(application.tests),
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/:id/applicants/:applicationId/tests/:testType",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      const applicationIdNum = Number(req.params.applicationId);
      const testType = req.params.testType;

      if (
        Number.isNaN(careerIdNum) ||
        Number.isNaN(applicationIdNum) ||
        !isTestType(testType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID, applicant ID, or test type",
        });
      }

      // score is not taken from the body; it is always derived from subjects
      const { testDate, subjects, status, remarks } = req.body ?? {};
      const parsedDate = parseTestDate(testDate);
      if (testDate !== undefined && parsedDate === undefined) {
        return res.status(400).json({
          success: false,
          message: "Invalid testDate format",
        });
      }

      if (
        subjects !== undefined &&
        subjects !== null &&
        !isValidSubjects(subjects)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subjects format. Each subject needs a subjectName and a subjectScore between 0 and 100",
        });
      }

      if (status !== undefined && status !== null && !isTestResult(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${Object.values(TestResult).join(", ")}`,
        });
      }

      if (
        remarks !== undefined &&
        remarks !== null &&
        typeof remarks !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid remarks format",
        });
      }

      const application = await prisma.jobApplication.findFirst({
        where: { applicationId: applicationIdNum, jobId: careerIdNum },
        select: { applicationId: true, remarks: true },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found for this career",
        });
      }

      const evaluatedBy = (req as any).user as JwtPayload | undefined;
      const data = {
        ...(parsedDate !== undefined && { testDate: parsedDate }),
        // Subjects and score are always saved together so they can't drift apart
        ...(subjects !== undefined && {
          subjects: subjects === null ? Prisma.DbNull : subjects,
          score:
            subjects === null
              ? null
              : averageOf(
                  (subjects as TestSubject[]).map((s) => s.subjectScore),
                ),
        }),
        ...(status !== undefined && { status }),
        evaluatedBy: evaluatedBy?.username ?? null,
      };

      // Remarks belong to the application, so they are saved there alongside
      // the test result
      const [, updated] = await prisma.$transaction([
        prisma.jobApplicationTest.upsert({
          where: {
            applicationId_testType: {
              applicationId: applicationIdNum,
              testType,
            },
          },
          create: { applicationId: applicationIdNum, testType, ...data },
          update: data,
        }),
        prisma.jobApplication.update({
          where: { applicationId: applicationIdNum },
          data:
            remarks !== undefined
              ? buildRemarksData(
                  remarks,
                  application.remarks,
                  evaluatedBy?.username,
                )
              : {},
          select: {
            applicationId: true,
            ...remarksSelect,
            tests: { select: testSelect, orderBy: testOrder },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: `${testType} test results updated successfully`,
        data: {
          applicationId: updated.applicationId,
          remarks: updated.remarks,
          remarksAt: updated.remarksAt,
          remarksBy: updated.remarksBy,
          ...formatTests(updated.tests),
        },
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Update an application's remarks on their own (any stage)
router.patch(
  "/:id/applicants/:applicationId/remarks",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const careerIdNum = Number(req.params.id);
      const applicationIdNum = Number(req.params.applicationId);
      if (Number.isNaN(careerIdNum) || Number.isNaN(applicationIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid career ID or applicant ID",
        });
      }

      const { remarks } = req.body ?? {};
      if (remarks !== null && typeof remarks !== "string") {
        return res.status(400).json({
          success: false,
          message: "remarks must be a string or null",
        });
      }

      const application = await prisma.jobApplication.findFirst({
        where: { applicationId: applicationIdNum, jobId: careerIdNum },
        select: { remarks: true },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found for this career",
        });
      }

      const user = (req as any).user as JwtPayload | undefined;
      const updated = await prisma.jobApplication.update({
        where: { applicationId: applicationIdNum },
        data: buildRemarksData(remarks, application.remarks, user?.username),
        select: { applicationId: true, ...remarksSelect },
      });

      return res.status(200).json({
        success: true,
        message: "Remarks updated successfully",
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
