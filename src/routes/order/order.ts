import { Request, Response, Router, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        shopId,
        customerId,
        paymentStatusId,
        statusId,
        invoiceNo,
        itemsPerPage,
        currentPage,
      } = req.query;

      const shopIdNum = typeof shopId === "string" ? Number(shopId) : undefined;
      const customerIdNum =
        typeof customerId === "string" ? Number(customerId) : undefined;
      const paymentStatusIdNum =
        typeof paymentStatusId === "string" ? Number(paymentStatusId) : undefined;
      const statusIdNum =
        typeof statusId === "string" ? Number(statusId) : undefined;
      const invoiceNoStr = typeof invoiceNo === "string" ? invoiceNo : undefined;

      const where: any = {};

      if (shopIdNum) {
        where.shopId = shopIdNum;
      }

      if (customerIdNum) {
        where.customerId = customerIdNum;
      }

      if (paymentStatusIdNum) {
        where.paymentStatusId = paymentStatusIdNum;
      }

      if (statusIdNum) {
        where.statusId = statusIdNum;
      }

      if (invoiceNoStr) {
        where.invoiceNo = invoiceNoStr;
      }

      const perPage =
        typeof itemsPerPage === "string" && !Number.isNaN(Number(itemsPerPage))
          ? Number(itemsPerPage)
          : 15;
      const page =
        typeof currentPage === "string" && !Number.isNaN(Number(currentPage))
          ? Number(currentPage)
          : 1;

      const totalItems = await prisma.order.count({ where });

      if (totalItems === 0) {
        return res.status(200).json({
          success: true,
          message: "Orders retrieved successfully",
          data: [],
          pagination: null,
        });
      }

      const totalPages = perPage > 0 ? Math.ceil(totalItems / perPage) : 0;
      const currentPageNumber = Math.min(Math.max(page, 1), totalPages || 1);
      const skip = (currentPageNumber - 1) * perPage;

      const rows = await prisma.order.findMany({
        where,
        orderBy: { orderProfileId: "desc" },
        skip,
        take: perPage,
        include: {
          shopWiseOrders: true,
          paymentInfo: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        data: rows,
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

      const order = await prisma.order.findUnique({
        where: { orderProfileId: Number(id) },
        include: {
          shopWiseOrders: true,
          paymentInfo: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        data: order,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
