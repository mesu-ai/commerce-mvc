import { Request, Response, Router, NextFunction } from "express";
import { prisma } from "../../config/prisma";

const router = Router();

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.user.findMany();
      return res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userData = await prisma.user.findUnique({
        where: { employeeId: id },
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          data: {},
        });
      }

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: userData,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
