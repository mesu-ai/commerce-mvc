import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Prisma } from "@prisma/client";

const router = Router();

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
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

export default router;
