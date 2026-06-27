import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { categoriesTree, categoriesWithLayer } from "../../data/category";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

// GET /  — paginated, keyword-searchable list (reads from PostgreSQL via Prisma)
router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, itemsPerPage, currentPage, getAll } = req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;

      // Build the WHERE clause: case-insensitive name search when a keyword is given.
      const where = keywordStr
        ? {
            categoryName: {
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

      const totalItems = await prisma.category.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Category retrieved successfully",
          data: [],
          pagination: {
            currentPage: 0,
            itemsPerPage: perPage,
            totalPages: 0,
            totalItems: 0,
          },
        });
      }

      // getAll=Y returns every matching row (no pagination).
      if (getAll === "Y") {
        const data = await prisma.category.findMany({
          where,
          orderBy: { categoryId: "asc" },
        });

        return res.status(200).json({
          success: true,
          message: "Category retrieved successfully",
          data,
          pagination: {
            currentPage: 1,
            itemsPerPage: totalItems,
            totalPages: 1,
            totalItems,
          },
        });
      }

      const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
      const currentPageNumber = Math.min(Math.max(page, 1), totalPages || 1);
      const skip = (currentPageNumber - 1) * perPage;

      const data = await prisma.category.findMany({
        where,
        orderBy: { categoryId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
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

// NOTE: static paths (/tree, /suggestions) MUST be declared BEFORE the dynamic
// "/:id" route, otherwise Express matches them as an id and they're unreachable.
router.get("/tree", verifyAccessToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Category tree retrieved successfully",
    data: categoriesTree,
  });
});


router.get("/suggestions", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(200).json({
      success: true,
      message: "Suggest category retrieved successfully",
      data: categoriesWithLayer,
    });
  }

  const suggestCategories = categoriesWithLayer.filter((c) =>
    c.categoryName.toLowerCase().includes(keyword.toString().toLowerCase().trim()),
  );

  return res.status(200).json({
    success: true,
    message: "Suggest category retrieved successfully",
    data: suggestCategories,
  });
});

// GET /:id  — single category by id (reads from PostgreSQL via Prisma)
router.get(
  "/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const categoryData = await prisma.category.findUnique({
        where: { categoryId: Number(id) },
      });

      if (!categoryData) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category retrieved successfully",
        data: categoryData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
