import { variantAttributeValues } from "../../data/variantAttributeValues";
import { variantAttributes } from "../../data/variantAttribute";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/attributes", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword, status, variantSetupTempleteId, itemsPerPage, currentPage } = req.query;

  const keywordStr = typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
  const statusStr = typeof status === "string" ? status : undefined;
  const variantSetupTempleteIdStr = typeof variantSetupTempleteId === "string" ? variantSetupTempleteId : undefined;

  let filtered = [...variantAttributes];

  if (keywordStr) {
    filtered = filtered.filter((attribute) =>
      attribute.variantName.toLowerCase().includes(keywordStr)
    );
  }

  if (statusStr) {
    filtered = filtered.filter((attribute) => attribute.isActive === statusStr);
  }

  if (variantSetupTempleteIdStr) {
    filtered = filtered.filter((attribute) => attribute.variantSetupTempleteId === Number(variantSetupTempleteIdStr));
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

  const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
  const currentPageNumber = Math.min(Math.max(page, 1), totalPages || 1);
  const startIndex = (currentPageNumber - 1) * perPage;
  const endIndex = startIndex + perPage;
  const pagedData = filtered.slice(startIndex, endIndex);

  return res.status(200).json({
    success: true,
    message: "Variants retrieved successfully",
    data: pagedData,
    pagination: {
      currentPage: currentPageNumber,
      itemsPerPage: perPage,
      totalPages,
      totalItems,
    },
  });
});

router.get(
  "/attributes/:id",
  verifyAccessToken,
  (req: Request, res: Response) => {
    const { id } = req.params;
    const attribute = variantAttributes.find((attr) => attr.productVariantId === Number(id));

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Variant attribute not found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Variant attribute retrieved successfully",
        data: attribute,
      });
    }
  },
);


router.get(
  "/attribute-values",
  verifyAccessToken,
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Variant attribute values retrieved successfully",
      data: variantAttributeValues,
    });
  },
);

export default router;
