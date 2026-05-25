import { sellerBanks, sellerData } from "../../data/seller";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

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

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const {
    approvalStatus,
    status,
    actStatus,
    keyword,
    currentPage,
    itemsPerPage,
  } = req.query;

  const approvalStatusFilter = normalizeValue(approvalStatus);
  const statusFilter = normalizeValue(status);
  const actStatusFilter = normalizeValue(actStatus);
  const keywordFilter = normalizeValue(keyword);

  const pageSize = Math.max(parseNumber(itemsPerPage, 15), 1);
  const requestedPage = Math.max(parseNumber(currentPage, 1), 1);

  let filteredSellers = [...sellerData];

  // if (shouldApplyFilter(approvalStatusFilter)) {
  //   filteredSellers = filteredSellers.filter(
  //     (seller) => normalizeValue(seller.isVerified) === approvalStatusFilter
  //   );
  // }

  if (shouldApplyFilter(statusFilter)) {
    filteredSellers = filteredSellers.filter(
      (seller) => normalizeValue(seller.isActive) === statusFilter
    );
  }

  if (shouldApplyFilter(actStatusFilter)) {
    filteredSellers = filteredSellers.filter(
      (seller) => normalizeValue(seller.actApprovedStatus) === actStatusFilter
    );
  }

  if (keywordFilter) {
    filteredSellers = filteredSellers.filter((seller) => {
      const sellerName = normalizeValue(seller.sellerName);
      const shopName = normalizeValue(seller.shopName);

      return (
        sellerName.includes(keywordFilter) || shopName.includes(keywordFilter)
      );
    });
  }

  const totalItems = filteredSellers.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;

  const currentPageNumber =
    totalPages === 0 ? 0 : Math.min(requestedPage, totalPages);
  const startIndex = currentPageNumber > 0 ? (currentPageNumber - 1) * pageSize : 0;
  const endIndex = startIndex + pageSize;
  const pagedData = currentPageNumber > 0 ? filteredSellers.slice(startIndex, endIndex) : [];

  res.status(200).json({
    success: true,
    message: "Seller retrieved successfully",
    pagination: {
      currentPage: currentPageNumber,
      pageSize,
      totalPages,
      totalItems,
    },
    data: pagedData,
  });
});

router.get("/:id", verifyAccessToken, (req: Request, res: Response) => {
  
  const { id } = req.params;
  const seller = sellerData.find((s) => s.sellerId === Number(id));

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
});


router.get("/shops/banks", verifyAccessToken, (req: Request, res: Response) => {
  
   const { shopId, currentPage, itemsPerPage } = req.query;
  //  const banks = sellerBanks.find((s) => s.shopId === Number(shopId));

  // if (!banks) {
  //   return res.status(404).json({
  //     success: false,
  //     message: "Banks not found",
  //     data: {},
  //   });
  // }
  
  return res.status(200).json({
    success: true,
    message: "Banks retrieved successfully",
    data: sellerBanks,
  });
});



export default router;

