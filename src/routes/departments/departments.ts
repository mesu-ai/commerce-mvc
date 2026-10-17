import { prisma } from "@/config/prisma";
import { Prisma } from "@prisma/client";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

const DEPARTMENT_STATUSES = ["Y", "N"];

// Validates a create/update department body. Only fields present in the body
// are returned; departmentName is required when creating.
function parseDepartmentInput(
  body: any,
  { isCreate }: { isCreate: boolean },
): Prisma.DepartmentUncheckedUpdateInput | { error: string } {
  const input = body ?? {};
  const data: Prisma.DepartmentUncheckedUpdateInput = {};

  if (input.departmentName !== undefined || isCreate) {
    if (
      typeof input.departmentName !== "string" ||
      input.departmentName.trim() === ""
    ) {
      return { error: "departmentName is required" };
    }
    data.departmentName = input.departmentName.trim();
  }

  if (input.status !== undefined || isCreate) {
    const status = input.status ?? "Y";
    if (!DEPARTMENT_STATUSES.includes(status)) {
      return {
        error: `Invalid status. Allowed: ${DEPARTMENT_STATUSES.join(", ")}`,
      };
    }
    data.status = status;
  }

  return data;
}

// Department names are shown in job dropdowns, so no two may share one
async function isNameTaken(departmentName: string, exceptId?: number) {
  const existing = await prisma.department.findFirst({
    where: {
      departmentName: { equals: departmentName, mode: "insensitive" },
      ...(exceptId && { departmentId: { not: exceptId } }),
    },
    select: { departmentId: true },
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

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const where: Prisma.DepartmentWhereInput = {};
      if (keywordStr) {
        where.departmentName = { contains: keywordStr, mode: "insensitive" };
      }
      if (statusStr) {
        where.status = statusStr;
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.department.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Departments retrieved successfully",
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

      const data = await prisma.department.findMany({
        where,
        orderBy: { departmentId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Departments retrieved successfully",
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
      const departmentId = parseId(req.params.id);
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const department = await prisma.department.findUnique({
        where: { departmentId },
      });
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Department retrieved successfully",
        data: department,
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
      const data = parseDepartmentInput(req.body, { isCreate: true });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      const name = data.departmentName as string;
      if (await isNameTaken(name)) {
        return res.status(409).json({
          success: false,
          message: `Department "${name}" already exists`,
        });
      }

      const department = await prisma.department.create({
        data: data as Prisma.DepartmentUncheckedCreateInput,
      });

      return res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// Update a department. Fields left out of the body are unchanged.
router.put(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseId(req.params.id);
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const data = parseDepartmentInput(req.body, { isCreate: false });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      const existing = await prisma.department.findUnique({
        where: { departmentId },
        select: { departmentId: true },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      if (
        typeof data.departmentName === "string" &&
        (await isNameTaken(data.departmentName, departmentId))
      ) {
        return res.status(409).json({
          success: false,
          message: `Department "${data.departmentName}" already exists`,
        });
      }

      const department = await prisma.department.update({
        where: { departmentId },
        data,
      });

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
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
      const departmentId = parseId(req.params.id);
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const { status } = req.body ?? {};
      if (!DEPARTMENT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${DEPARTMENT_STATUSES.join(", ")}`,
        });
      }

      const { count } = await prisma.department.updateMany({
        where: { departmentId },
        data: { status },
      });
      if (count === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Department status updated successfully",
        data: { departmentId, status },
      });
    } catch (error) {
      return next(error);
    }
  },
);

// Departments still used by a job can't be deleted; deactivate them instead
router.delete(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseId(req.params.id);
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const department = await prisma.department.findUnique({
        where: { departmentId },
        select: { _count: { select: { careers: true } } },
      });
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      const jobCount = department._count.careers;
      if (jobCount > 0) {
        return res.status(409).json({
          success: false,
          message: `Department is used by ${jobCount} job(s); set its status to "N" instead`,
        });
      }

      await prisma.department.delete({ where: { departmentId } });

      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
        data: { departmentId },
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
