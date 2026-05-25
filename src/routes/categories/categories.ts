import { categories, categoriesTree, categoriesWithLayer } from "../../data/category";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Category retrieved successfully",
    data: categories,
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

export default router;