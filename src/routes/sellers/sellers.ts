import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { sellerBanks } from "../../data/seller";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

const normalizeValue = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const parseNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const shouldApplyFilter = (value: string): boolean =>
  value.length > 0 && value !== "all";

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, actStatus, keyword, currentPage, itemsPerPage } =
        req.query;

      const statusFilter = normalizeValue(status);
      const actStatusFilter = normalizeValue(actStatus);
      const keywordFilter = normalizeValue(keyword);

      const pageSize = Math.max(parseNumber(itemsPerPage, 15), 1);
      const requestedPage = Math.max(parseNumber(currentPage, 1), 1);

      const where: any = {};
      if (shouldApplyFilter(statusFilter)) {
        where.isActive = { equals: statusFilter, mode: "insensitive" };
      }
      if (shouldApplyFilter(actStatusFilter)) {
        where.actApprovedStatus = {
          equals: actStatusFilter,
          mode: "insensitive",
        };
      }
      if (keywordFilter) {
        where.OR = [
          { sellerName: { contains: keywordFilter, mode: "insensitive" } },
          { shopName: { contains: keywordFilter, mode: "insensitive" } },
        ];
      }

      const totalItems = await prisma.seller.count({ where });
      const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
      const currentPageNumber =
        totalPages === 0 ? 0 : Math.min(requestedPage, totalPages);
      const skip =
        currentPageNumber > 0 ? (currentPageNumber - 1) * pageSize : 0;

      const data =
        currentPageNumber > 0
          ? await prisma.seller.findMany({
              where,
              orderBy: { sellerId: "asc" },
              skip,
              take: pageSize,
            })
          : [];

      return res.status(200).json({
        success: true,
        message: "Seller retrieved successfully",
        pagination: {
          currentPage: currentPageNumber,
          pageSize,
          totalPages,
          totalItems,
        },
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

// Static path must come before "/:id" so it isn't matched as an id.
router.get("/shops/banks", verifyAccessToken, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Banks retrieved successfully",
    data: sellerBanks,
  });
});

router.get(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const seller = await prisma.seller.findUnique({
        where: { sellerId: Number(id) },
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: "Seller not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Seller retrieved successfully",
        data: seller,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
