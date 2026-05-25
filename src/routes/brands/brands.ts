import { brands } from "../../data/brand";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword, status, itemsPerPage, currentPage } = req.query;

  const keywordStr =
    typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
  const statusStr = typeof status === "string" ? status : undefined;

  let filtered = [...brands];

  if (keywordStr) {
    filtered = filtered.filter((brand) =>
      brand.brandName.toLowerCase().includes(keywordStr)
    );
  }

  if (statusStr) {
    filtered = filtered.filter((brand) => brand.isActive === statusStr);
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
      message: "Brand retrieved successfully",
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
  const startIndex = (currentPageNumber - 1) * perPage;
  const endIndex = startIndex + perPage;
  const pagedData = filtered.slice(startIndex, endIndex);

  return res.status(200).json({
    success: true,
    message: "Brand retrieved successfully",
    data: pagedData,
    pagination: {
      currentPage: currentPageNumber,
      itemsPerPage: perPage,
      totalPages,
      totalItems,
    },
  });
});

router.get("/:id", verifyAccessToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const brandIdNum = Number(id);
  if (Number.isNaN(brandIdNum)) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand ID",
    });
  }

  const brand = brands.find((b) => b.brandId === brandIdNum);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Brand not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Brand retrieved successfully",
    data: brand,
  });
});

export default router;
