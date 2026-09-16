import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, departmentId, status, startDate, endDate, itemsPerPage, currentPage } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const departmentIdNum = typeof departmentId === "string" ? Number(departmentId) : undefined;
      const startDateStr = typeof startDate === "string" ? startDate : undefined;
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
          ...(startDateStr && { gte: startDateStr }),
          ...(endDateStr && { lte: endDateStr }),
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

export default router;
