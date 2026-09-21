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
      const typeStr = typeof type === "string" ? type : undefined;
      if (!typeStr) {
        return res.status(400).json({
          success: false,
          message: "Type query parameter is required",
          data: [],
        });
      }
      let where: any = {};
      if (typeStr) where.type = typeStr;

      const data = await prisma.columnSetting.findMany({ where });

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
