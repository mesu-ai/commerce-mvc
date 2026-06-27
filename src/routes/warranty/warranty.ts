import { Router, Response, Request, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/types",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.warrantyType.findMany({
        orderBy: { warrantyTypeId: "asc" },
      });
      return res.json({
        success: true,
        message: "Warranty types retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/periods",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.warrantyPeriod.findMany({
        orderBy: { warrantyPeriodId: "asc" },
      });
      return res.json({
        success: true,
        message: "Warranty periods retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
