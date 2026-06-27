import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { verifyAccessToken } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.role.findMany({ orderBy: { id: "asc" } });
      return res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data,
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
      const roleData = await prisma.role.findUnique({
        where: { id: Number(id) },
      });

      if (!roleData) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "Role retrieved successfully",
        data: roleData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
