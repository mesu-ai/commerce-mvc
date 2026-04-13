import { columns } from "../../data/column";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const { type } = req.query;
  if (type === "products") {
    res.status(200).json({
      success: true,
      message: "Columns retrieved successfully",
      data: columns,
    });
  }
});

export default router;