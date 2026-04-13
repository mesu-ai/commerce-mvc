import { products } from "../../data/product";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

type ProductListItem = {
  productId: number;
  productName: string;
  thumbnailImage: string;
  shopId: number;
  shopName: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  unit: string;
  status: string;
  approvalStatus: string;
  dpPrice: number;
  mrp: number;
  sellingPrice: number;
  updatedAt: string;
  displayOrder: number;
};

const approvalStatusValues = [
  "approved",
  "pending",
  "rejected",
  "lowstock",
  "draft",
];

const categoryOptions = [
  { id: 4, name: "Mens Panjabi" },
  { id: 6, name: "Mens Casual Shirt" },
  { id: 39, name: "Saree" },
  { id: 40, name: "Womens Pant" },
  { id: 41, name: "Womens Top Wear" },
];

const shopOptions = [
  { id: 2, name: "SaRa Lifestyle Ltd" },
  { id: 49, name: "Cheetah" },
  { id: 83, name: "Bata" },
  { id: 84, name: "Apex" },
];

const brandIds = [1, 2, 3];
const units = ["psc", "set"];
const statusValues = ["Y", "N"];

const listProducts: ProductListItem[] = Array.from(
  { length: 30 },
  (_, index) => {
    const productId = index + 1;
    const category = categoryOptions[index % categoryOptions.length];
    const shop = shopOptions[index % shopOptions.length];
    const approval = approvalStatusValues[index % approvalStatusValues.length];
    const brandId = brandIds[index % brandIds.length];
    const unit = units[index % units.length];
    const status = statusValues[index % statusValues.length];

    return {
      productId,
      productName: `${category.name} #${productId}`,
      thumbnailImage:
        "/Images/Products/thumbnail/thumbnail_one/1ae1de77e962408da5bd57d1b13a8d65.jpeg",
      shopId: shop.id,
      shopName: shop.name,
      brandName: `Brand ${brandId}`,
      sku: `SKU-${productId.toString().padStart(5, "0")}`,
      categoryId: category.id,
      categoryName: category.name,
      brandId,
      unit,
      status,
      approvalStatus: approval,
      dpPrice: 500 + (index % 5) * 20,
      mrp: 700 + (index % 5) * 20,
      sellingPrice: 600 + (index % 5) * 20,
      displayOrder: index + 1,
      updatedAt: "2026-04-04T09:50",
    };
  },
);

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const {
    approvalStatus,
    categoryId,
    shopId,
    brandId,
    unit,
    status,
    itemsPerPage,
    currentPage,
  } = req.query;

  let filtered = [...listProducts];

  const approvalStatusStr =
    typeof approvalStatus === "string" ? approvalStatus : undefined;
  const categoryIdNum =
    typeof categoryId === "string" ? Number(categoryId) : undefined;
  const shopIdNum = typeof shopId === "string" ? Number(shopId) : undefined;
  const brandIdNum = typeof brandId === "string" ? Number(brandId) : undefined;
  const unitStr = typeof unit === "string" ? unit : undefined;
  const statusStr = typeof status === "string" ? status : undefined;

  if (approvalStatusStr && approvalStatusStr !== "all") {
    filtered = filtered.filter(
      (product) => product.approvalStatus === approvalStatusStr
    );
  }

  if (categoryIdNum) {
    filtered = filtered.filter(
      (product) => product.categoryId === categoryIdNum
    );
  }

  if (shopIdNum) {
    filtered = filtered.filter((product) => product.shopId === shopIdNum);
  }

  if (brandIdNum) {
    filtered = filtered.filter((product) => product.brandId === brandIdNum);
  }

  if (unitStr) {
    filtered = filtered.filter((product) => product.unit === unitStr);
  }

  if (statusStr) {
    filtered = filtered.filter((product) => product.status === statusStr);
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
      message: "Products retrieved successfully",
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
    message: "Products retrieved successfully",
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
  const product = products.find((p) => p.productId === Number(id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Role not found",
      data: {},
    });
  }
  
  return res.status(200).json({
    success: true,
    message: "Product retrived successfully",
    data: product,
  });
});



export default router;
