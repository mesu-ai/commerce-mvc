import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/redis",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, itemsPerPage, currentPage, getAll } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;

      const where = keywordStr
        ? {
            key: {
              contains: keywordStr,
              mode: "insensitive" as const,
            },
          }
        : {};

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.redisCache.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Cache entries retrieved successfully",
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

      const data = await prisma.redisCache.findMany({
        where,
        orderBy: { key: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Cache entries retrieved successfully",
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

export default router;
