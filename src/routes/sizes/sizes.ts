import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/attributes",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, status, itemsPerPage, currentPage } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const statusStr = typeof status === "string" ? status : undefined;

      const where: any = {};
      if (keywordStr) {
        where.attributeName = { contains: keywordStr, mode: "insensitive" };
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

      const totalItems = await prisma.sizeAttribute.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Charts retrieved successfully",
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

      const data = await prisma.sizeAttribute.findMany({
        where,
        orderBy: { attributeId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Charts retrieved successfully",
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
  "/charts",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, status, itemsPerPage, currentPage } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      
        const statusStr = typeof status === "string" ? status : undefined;

      const where: any = {};
      if (keywordStr) {
        where.chartName = { contains: keywordStr, mode: "insensitive" };
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

      const totalItems = await prisma.sizeChart.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Charts retrieved successfully",
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

      const data = await prisma.sizeChart.findMany({
        where,
        orderBy: { sizeChartId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Charts retrieved successfully",
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
  "/charts/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const sizechart = await prisma.sizeChart.findUnique({
        where: {
          sizeChartId: Number(id),
        },
      });

      if (!sizechart) {
        return res.status(404).json({
          success: false,
          message: "Size chart not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Size chart retrieved successfully",
        data: sizechart,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
