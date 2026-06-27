import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { keyword } = req.query;
      const searchKeyword =
        typeof keyword === "string" ? keyword.trim().toLowerCase() : undefined;

      const data = await prisma.shop.findMany({
        where: searchKeyword
          ? { shopName: { contains: searchKeyword, mode: "insensitive" } }
          : undefined,
        orderBy: { shopId: "asc" },
      });

      return res.status(200).json({
        success: true,
        message: "Shop retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
