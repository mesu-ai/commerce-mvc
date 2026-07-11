import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, status, itemsPerPage, currentPage } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const where: any = {};
      if (keywordStr) {
        where.outletName = { contains: keywordStr, mode: "insensitive" };
      }
      if (statusStr) {
        where.isActive = statusStr;
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.outlet.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Outlets retrieved successfully",
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

      const data = await prisma.outlet.findMany({
        where,
        orderBy: { outletId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Outlets retrieved successfully",
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
      const outletIdNum = Number(id);
      if (Number.isNaN(outletIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid outlet ID",
        });
      }

      const outlet = await prisma.outlet.findUnique({
        where: { outletId: outletIdNum },
      });

      if (!outlet) {
        return res.status(404).json({
          success: false,
          message: "Outlet not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Outlet retrieved successfully",
        data: outlet,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
