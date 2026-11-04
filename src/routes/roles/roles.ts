import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";

const router = Router();

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const ROLE_STATUSES = ["Y", "N"];

// Validates a create/update role body. Only fields present in the body are
// returned; roleName is required when creating.
function parseRoleInput(
  body: any,
  { isCreate }: { isCreate: boolean },
): Prisma.RoleUpdateInput | { error: string } {
  const input = body ?? {};
  const data: Prisma.RoleUpdateInput = {};

  if (input.roleName !== undefined || isCreate) {
    if (typeof input.roleName !== "string" || input.roleName.trim() === "") {
      return { error: "roleName is required" };
    }
    data.roleName = input.roleName.trim();
  }

  if (input.status !== undefined || isCreate) {
    const status = input.status ?? "Y";
    if (!ROLE_STATUSES.includes(status)) {
      return { error: `Invalid status. Allowed: ${ROLE_STATUSES.join(", ")}` };
    }
    data.status = status;
  }

  if (input.permissions !== undefined || isCreate) {
    const permissions = input.permissions ?? [];
    if (
      !Array.isArray(permissions) ||
      !permissions.every((p: unknown) => typeof p === "string" && p.trim())
    ) {
      return { error: "permissions must be an array of strings" };
    }
    data.permissions = [
      ...new Set(permissions.map((p: string) => p.trim())),
    ] as string[];
  }

  return data;
}

async function isNameTaken(roleName: string, exceptId?: number) {
  const existing = await prisma.role.findFirst({
    where: {
      roleName: { equals: roleName, mode: "insensitive" },
      ...(exceptId && { roleId: { not: exceptId } }),
    },
    select: { roleId: true },
  });
  return !!existing;
}

function paginate(query: Request["query"], totalItems: number) {
  const perPage = parseId(query.itemsPerPage) ?? 15;
  const totalPages = Math.ceil(totalItems / perPage);
  const currentPage =
    totalItems === 0
      ? 0
      : Math.min(parseId(query.currentPage) ?? 1, totalPages);

  return {
    skip: Math.max(currentPage - 1, 0) * perPage,
    take: perPage,
    pagination: { currentPage, itemsPerPage: perPage, totalPages, totalItems },
  };
}

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, status } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.trim() : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const where: Prisma.RoleWhereInput = {};
      if (keywordStr) {
        where.roleName = { contains: keywordStr, mode: "insensitive" };
      }

      if (statusStr) {
        where.status = statusStr;
      }

      const totalItems = await prisma.role.count({ where });
      const { skip, take, pagination } = paginate(req.query, totalItems);

      const roles = await prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { roleId: "asc" },
      });

      return res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data: roles,
        pagination,
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
      const roleData = await prisma.role.findUnique({
        where: { roleId: Number(id) },
      });

      if (!roleData) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Role retrieved successfully",
        data: roleData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = parseRoleInput(req.body, { isCreate: true });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      const name = data.roleName as string;
      if (await isNameTaken(name)) {
        return res.status(409).json({
          success: false,
          message: `Role "${name}" already exists`,
        });
      }

      const roleData = await prisma.role.create({
        data: data as Prisma.RoleCreateInput,
      });

      return res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: roleData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Update a role. Fields left out of the body are unchanged.
router.put(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = parseId(req.params.id);
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const data = parseRoleInput(req.body, { isCreate: false });
      if ("error" in data) {
        return res.status(400).json({ success: false, message: data.error });
      }

      const existing = await prisma.role.findUnique({
        where: { roleId },
        select: { roleName: true },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      if (
        typeof data.roleName === "string" &&
        (await isNameTaken(data.roleName, roleId))
      ) {
        return res.status(409).json({
          success: false,
          message: `Role "${data.roleName}" already exists`,
        });
      }

      // Users keep a copy of roleName, so rename them along with the role
      const renamed =
        typeof data.roleName === "string" &&
        data.roleName !== existing.roleName;

      const [roleData] = await prisma.$transaction([
        prisma.role.update({ where: { roleId }, data }),
        ...(renamed
          ? [
              prisma.user.updateMany({
                where: { roleId },
                data: { roleName: data.roleName as string },
              }),
            ]
          : []),
      ]);

      return res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: roleData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
