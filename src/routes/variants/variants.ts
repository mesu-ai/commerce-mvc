import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

// ---- Variant attributes ----
router.get(
  "/attributes",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, status, variantSetupTempleteId, itemsPerPage, currentPage } =
        req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const statusStr = typeof status === "string" ? status : undefined;
      const variantSetupTempleteIdStr =
        typeof variantSetupTempleteId === "string"
          ? variantSetupTempleteId
          : undefined;

      const where: any = {};
      if (keywordStr) {
        where.variantName = { contains: keywordStr, mode: "insensitive" };
      }
      if (statusStr) {
        where.isActive = statusStr;
      }
      if (variantSetupTempleteIdStr) {
        where.variantSetupTempleteId = Number(variantSetupTempleteIdStr);
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.variantAttribute.count({ where });

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
      const skip = (currentPageNumber - 1) * perPage;

      const data = await prisma.variantAttribute.findMany({
        where,
        orderBy: { productVariantId: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Variants retrieved successfully",
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
  "/attributes/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attribute = await prisma.variantAttribute.findUnique({
        where: { productVariantId: Number(id) },
      });

      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: "Variant attribute not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Variant attribute retrieved successfully",
        data: attribute,
      });
    } catch (err) {
      return next(err);
    }
  },
);

// ---- Variant attribute values ----
router.get(
  "/attribute-values",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, productVariantId, itemsPerPage, currentPage, getAll } =
        req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const productVariantIdStr =
        typeof productVariantId === "string" ? productVariantId : undefined;

      const where: any = {};
      if (productVariantIdStr) {
        where.productVariantId = Number(productVariantIdStr);
      }
      if (keywordStr) {
        where.variantName = { contains: keywordStr, mode: "insensitive" };
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.variantAttributeValue.count({ where });

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
        const data = await prisma.variantAttributeValue.findMany({
          where,
          orderBy: { id: "asc" },
        });
        return res.status(200).json({
          success: true,
          message: "Variants retrieved successfully",
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

      const data = await prisma.variantAttributeValue.findMany({
        where,
        orderBy: { id: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Variants retrieved successfully",
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
  "/attribute-values/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attribute = await prisma.variantAttributeValue.findFirst({
        where: { variantOptionId: Number(id) },
      });

      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: "Variant attribute not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Variant attribute retrieved successfully",
        data: attribute,
      });
    } catch (err) {
      return next(err);
    }
  },
);

// ---- Variant category configurations ----
router.get(
  "/category-configurations",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword, productVariantId, variantTempleteId, itemsPerPage, currentPage, getAll } =
        req.query;

      const keywordStr =
        typeof keyword === "string" ? keyword.toLowerCase().trim() : undefined;
      const productVariantIdStr =
        typeof productVariantId === "string" ? productVariantId : undefined;
      const variantTempleteIdStr =
        typeof variantTempleteId === "string" ? variantTempleteId : undefined;

      const where: any = {};
      if (productVariantIdStr) {
        where.productVariantId = Number(productVariantIdStr);
      }
      if (variantTempleteIdStr) {
        where.variantTempleteId = Number(variantTempleteIdStr);
      }
      if (keywordStr) {
        where.variantName = { contains: keywordStr, mode: "insensitive" };
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.variantCategoryCombination.count({ where });

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
        const data = await prisma.variantCategoryCombination.findMany({
          where,
          orderBy: { id: "asc" },
        });
        return res.status(200).json({
          success: true,
          message: "Variants retrieved successfully",
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

      const data = await prisma.variantCategoryCombination.findMany({
        where,
        orderBy: { id: "asc" },
        skip,
        take: perPage,
      });

      return res.status(200).json({
        success: true,
        message: "Variants retrieved successfully",
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
  "/categorywise-variantoptions",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productCategoryId, variantTempleteId } = req.query;

      if (!productCategoryId) {
        return res.status(400).json({
          success: false,
          message: "CategoryId is required",
        });
      }

      const where: any = { productCategoryId: Number(productCategoryId) };
      if (variantTempleteId) {
        where.variantTempleteId = Number(variantTempleteId);
      }

      const filtered = await prisma.variantCategoryCombination.findMany({
        where,
      });

      const variantWiseGrouped = filtered.reduce((acc: any, curr: any) => {
        const variantId = curr.productVariantId;
        if (!acc[variantId]) {
          acc[variantId] = {
            productVariantId: curr.productVariantId,
            variantName: curr.variantName,
            productVariantOptions: [],
          };
        }

        acc[variantId].productVariantOptions.push({
          variantOptionId: curr.variantOptionId,
          variantOptionText: curr.variantOptionText,
          variantOptionValue: curr.variantOptionValue,
        });
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        message: "Category-wise variant options retrieved successfully",
        data: Object.values(variantWiseGrouped),
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/category-configurations/:id",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attribute = await prisma.variantCategoryCombination.findFirst({
        where: { variantOptionId: Number(id) },
      });

      if (!attribute) {
        return res.status(404).json({
          success: false,
          message: "Variant attribute not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Variant attribute retrieved successfully",
        data: attribute,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
