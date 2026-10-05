import { Router, Request, Response, NextFunction } from "express";
import { Prisma, TestType, TestResult } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { verifyAccessToken, JwtPayload } from "../../middleware/auth.middleware";

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

type TestRow = Prisma.JobApplicationTestGetPayload<{ select: typeof testSelect }>;
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
  if (tests.some((t) => t.status === TestResult.fail || t.status === TestResult.absent)) {
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

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        keyword,
        departmentId,
        status,
        startDate,
        endDate,
        itemsPerPage,
        currentPage,
      } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const departmentIdNum =
        typeof departmentId === "string" ? Number(departmentId) : undefined;
      const startDateStr =
        typeof startDate === "string" ? startDate : undefined;
      const endDateStr = typeof endDate === "string" ? endDate : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const where: any = {};
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

      const data = await prisma.career.findMany({
        where,
        orderBy: { jobId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Careers retrieved successfully",
        data,
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

      const {
        keyword,
        status,
        stage,
        startDate,
        endDate,
        divisionId,
        universityId,

        itemsPerPage,
        currentPage,
      } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const stageStr = typeof stage === "string" ? stage : undefined;
      const statusStr = typeof status === "string" ? status : undefined;
      const startDateStr =
        typeof startDate === "string" ? startDate : undefined;
      const endDateStr = typeof endDate === "string" ? endDate : undefined;
      
      const divisionIdNum =
        typeof divisionId === "string" ? Number(divisionId) : undefined;

      const universityIdNum =
        typeof universityId === "string" ? Number(universityId) : undefined;

      const where: any = { jobId: careerIdNum };

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
          return res.status(400).json({
            success: false,
            message: `Invalid status for test stage. Allowed: ${[...Object.values(TestType), OVERALL_STATUS].join(", ")}`,
          });
        }
      } else if (statusStr) {
        where.status = statusStr;
      }

      const applicantFilters: any = {};

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

      if (subjects !== undefined && subjects !== null && !isValidSubjects(subjects)) {
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

      if (remarks !== undefined && remarks !== null && typeof remarks !== "string") {
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
              : averageOf((subjects as TestSubject[]).map((s) => s.subjectScore)),
        }),
        ...(status !== undefined && { status }),
        evaluatedBy: evaluatedBy?.username ?? null,
      };

      // Remarks belong to the application, so they are saved there alongside
      // the test result
      const [, updated] = await prisma.$transaction([
        prisma.jobApplicationTest.upsert({
          where: {
            applicationId_testType: { applicationId: applicationIdNum, testType },
          },
          create: { applicationId: applicationIdNum, testType, ...data },
          update: data,
        }),
        prisma.jobApplication.update({
          where: { applicationId: applicationIdNum },
          data:
            remarks !== undefined
              ? buildRemarksData(remarks, application.remarks, evaluatedBy?.username)
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

// Move one or more applicants to another stage. For the test stage, the
// selected test types are assigned by creating a pending test row for each.
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

      const { applicationIds, stage, status, testTypes } = req.body ?? {};

      if (!isPositiveIntArray(applicationIds)) {
        return res.status(400).json({
          success: false,
          message: "applicationIds must be a non-empty array of IDs",
        });
      }

      if (typeof stage !== "string" || stage.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "stage is required",
        });
      }

      if (status !== undefined && status !== null && typeof status !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid status format",
        });
      }

      const isTestStage = stage === TEST_STAGE;
      if (
        isTestStage &&
        (!Array.isArray(testTypes) ||
          testTypes.length === 0 ||
          !testTypes.every(isTestType))
      ) {
        return res.status(400).json({
          success: false,
          message: `testTypes is required for the test stage. Allowed: ${Object.values(TestType).join(", ")}`,
        });
      }

      const uniqueIds = [...new Set(applicationIds)];
      const uniqueTestTypes: TestType[] = isTestStage
        ? [...new Set(testTypes as TestType[])]
        : [];

      const matched = await prisma.jobApplication.count({
        where: { applicationId: { in: uniqueIds }, jobId: careerIdNum },
      });
      if (matched !== uniqueIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more applicants not found for this career",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.jobApplication.updateMany({
          where: { applicationId: { in: uniqueIds }, jobId: careerIdNum },
          // Test-stage status lives on the test rows, so the column is cleared
          data: { stage, status: isTestStage ? null : (status ?? null) },
        });

        if (isTestStage) {
          // Existing rows (and their scores) are kept; only new types are added
          await tx.jobApplicationTest.createMany({
            data: uniqueIds.flatMap((applicationId) =>
              uniqueTestTypes.map((testType) => ({ applicationId, testType })),
            ),
            skipDuplicates: true,
          });
        }
      });

      const moved = await prisma.jobApplication.findMany({
        where: { applicationId: { in: uniqueIds } },
        include: { tests: { select: testSelect, orderBy: testOrder } },
        orderBy: { applicationId: "asc" },
      });

      return res.status(200).json({
        success: true,
        message: `Applicants moved to ${stage} successfully`,
        data: moved.map(({ tests, ...application }) => ({
          ...application,
          ...(application.stage === TEST_STAGE && { status: OVERALL_STATUS }),
          ...formatTests(tests),
        })),
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
