import { categories, categoriesTree, categoriesWithLayer } from "../../data/category";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword, itemsPerPage, currentPage, getAll } = req.query;
  const keywordStr =
    typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;

  let filtered = [...categories];

  if (keywordStr) {
    filtered = filtered.filter((c) =>
      c.categoryName.toLowerCase().includes(keywordStr),
    );
  }

  const perPage =
    typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
      ? Number(itemsPerPage)
      : 15;

  const page =
    typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
      ? Number(currentPage)
      : 1;

  const totalItems = filtered.length;

  if (totalItems === 0) {
    return res.status(200).json({
      success: true,
      message: "Variants retrieved successfully",
      data: [],
      pagination: {
        currentPage: 0,
        itemsPerPage: perPage,
        totalPages: 0,
        totalItems: 0,
      },
    });
  }

  if (getAll === "Y") {
    return res.status(200).json({
      success: true,
      message: "Variants retrieved successfully",
      data: filtered,
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
  const startIndex = (currentPageNumber - 1) * perPage;
  const endIndex = startIndex + perPage;
  const pagedData = filtered.slice(startIndex, endIndex);

  return res.status(200).json({
    success: true,
    message: "Category retrieved successfully",
    data: pagedData,
    pagination: {
      currentPage: currentPageNumber,
      itemsPerPage: perPage,
      totalPages,
      totalItems,
    },
  });
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const categoryData = categories.find((c) => c.categoryId === Number(id));

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
});

router.get("/tree", verifyAccessToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Category tree retrieved successfully",
    data: categoriesTree,
  });
});

router.get("/suggessions", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(200).json({
      success: true,
      message: "Suggest category retrieved successfully",
      data: categoriesWithLayer,
    });
  }

  const suggestCategories = categoriesWithLayer.filter((c) =>
    c.name.toLowerCase().includes(keyword.toString().toLowerCase().trim()),
  );

  return res.status(200).json({
    success: true,
    message: "Suggest category retrieved successfully",
    data: suggestCategories,
  });
});



export default router;