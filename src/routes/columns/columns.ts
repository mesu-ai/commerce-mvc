import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query;

      // Currently only the "products" column set exists.
      const data =
        type === "products"
          ? await prisma.columnSetting.findMany()
          : [];

      return res.status(200).json({
        success: true,
        message: "Columns retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
