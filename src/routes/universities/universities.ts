import { prisma } from "@/config/prisma";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response, NextFunction } from "express";

const router = Router();
const UNIVERSITY_STATUSES = ["Y", "N"];

function parseUniversityInput(
  body: any,
  { isCreate }: { isCreate: boolean },
): Prisma.UniversityUncheckedUpdateInput | { error: string } {
  const input = body ?? {};
  const data: Prisma.UniversityUncheckedUpdateInput = {};

  if (input.universityName !== undefined || isCreate) {
    if (
      typeof input.universityName !== "string" ||
      input.universityName.trim() === ""
    ) {
      return { error: "universityName is required" };
    }
    data.universityName = input.universityName.trim();
  }

  if (input.status !== undefined || isCreate) {
    const status = input.status ?? "Y";
    if (!UNIVERSITY_STATUSES.includes(status)) {
      return {
        error: `Invalid status. Allowed: ${UNIVERSITY_STATUSES.join(", ")}`,
      };
    }
    data.status = status;
  }

  return data;
}

async function isNameTaken(universityName: string, exceptId?: number) {
  const existing = await prisma.university.findFirst({
    where: {
      universityName: { equals: universityName, mode: "insensitive" },
      ...(exceptId && { universityId: { not: exceptId } }),
    },
    select: { universityId: true },
  });
  return !!existing;
}

function parseId(value: string | string[] | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, currentPage, status, itemsPerPage } = req.query;
      const where: Prisma.UniversityWhereInput = {};
      if (typeof keyword === "string" && keyword.trim()) {
        where.universityName = {
          contains: keyword.trim(),
          mode: "insensitive",
        };
      }
      if (typeof status === "string") where.status = status;

      const perPage =
        typeof itemsPerPage === "string" && Number(itemsPerPage) > 0
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && Number(currentPage) > 0
          ? Number(currentPage)
          : 1;
      const totalItems = await prisma.university.count({ where });
      const totalPages = Math.ceil(totalItems / perPage);
      const currentPageNumber =
        totalItems === 0 ? 0 : Math.min(page, totalPages);
      const data = totalItems
        ? await prisma.university.findMany({
            where,
            orderBy: { universityName: "asc" },
            skip: Math.max(currentPageNumber - 1, 0) * perPage,
            take: perPage,
          })
        : [];

      return res.status(200).json({
        success: true,
        message: "Universities retrieved successfully",
        data,
        pagination: {
          currentPage: currentPageNumber,
          itemsPerPage: perPage,
          totalPages,
          totalItems,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const universityId = parseId(req.params.id);
      if (!universityId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid university ID" });
      const university = await prisma.university.findUnique({
        where: { universityId },
      });
      if (!university)
        return res
          .status(404)
          .json({ success: false, message: "University not found" });
      return res.status(200).json({
        success: true,
        message: "University retrieved successfully",
        data: university,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = parseUniversityInput(req.body, { isCreate: true });
      if ("error" in data)
        return res.status(400).json({ success: false, message: data.error });
      const name = data.universityName as string;
      if (await isNameTaken(name))
        return res.status(409).json({
          success: false,
          message: `University "${name}" already exists`,
        });
      const university = await prisma.university.create({
        data: data as Prisma.UniversityUncheckedCreateInput,
      });
      return res.status(201).json({
        success: true,
        message: "University created successfully",
        data: university,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const universityId = parseId(req.params.id);
      if (!universityId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid university ID" });
      const data = parseUniversityInput(req.body, { isCreate: false });
      if ("error" in data)
        return res.status(400).json({ success: false, message: data.error });
      if (
        !(await prisma.university.findUnique({
          where: { universityId },
          select: { universityId: true },
        }))
      )
        return res
          .status(404)
          .json({ success: false, message: "University not found" });
      if (
        typeof data.universityName === "string" &&
        (await isNameTaken(data.universityName, universityId))
      )
        return res.status(409).json({
          success: false,
          message: `University "${data.universityName}" already exists`,
        });
      const university = await prisma.university.update({
        where: { universityId },
        data,
      });
      return res.status(200).json({
        success: true,
        message: "University updated successfully",
        data: university,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:id/status",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const universityId = parseId(req.params.id);
      const { status } = req.body ?? {};
      if (!universityId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid university ID" });
      if (!UNIVERSITY_STATUSES.includes(status))
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${UNIVERSITY_STATUSES.join(", ")}`,
        });
      const { count } = await prisma.university.updateMany({
        where: { universityId },
        data: { status },
      });
      if (!count)
        return res
          .status(404)
          .json({ success: false, message: "University not found" });
      return res.status(200).json({
        success: true,
        message: "University status updated successfully",
        data: { universityId, status },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const universityId = parseId(req.params.id);
      if (!universityId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid university ID" });
      const university = await prisma.university.findUnique({
        where: { universityId },
        select: { _count: { select: { applicants: true } } },
      });
      if (!university)
        return res
          .status(404)
          .json({ success: false, message: "University not found" });
      if (university._count.applicants > 0)
        return res.status(409).json({
          success: false,
          message: `University is used by ${university._count.applicants} applicant(s); set its status to "N" instead`,
        });
      await prisma.university.delete({ where: { universityId } });
      return res.status(200).json({
        success: true,
        message: "University deleted successfully",
        data: { universityId },
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
