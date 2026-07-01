import { prisma } from "@/config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response, NextFunction } from "express";


const router = Router();

router.get(
  "/categories",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, currentPage, status, itemsPerPage } = req.query;

            const keywordStr =
              typeof keyword === "string"
                ? keyword.toLowerCase().trim()
                : undefined;
            const statusStr = typeof status === "string" ? status : undefined;
      
            const where: any = {};
            if (keywordStr) {
              where.contentTypeName = { contains: keywordStr, mode: "insensitive" };
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
      
            const totalItems = await prisma.contentCategory.count({ where });
      
            if (totalItems === 0) {
              return res.status(200).json({
                success: true,
                message: "Content categories retrieved successfully",
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
      
            const data = await prisma.contentCategory.findMany({
              where,
              orderBy: { contentTypeId: "asc" },
              skip,
              take: perPage,
            });
      
            return res.status(200).json({
              success: true,
              message: "Content categories retrieved successfully",
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

export default router;
