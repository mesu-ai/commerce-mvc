import { verifyAccessToken } from "../../middleware/auth.middleware";
import { warrantyPeriods, warrantyTypes } from "../../data/warranty";
import { Router, Response, Request } from "express";

const router = Router();

router.get("/types", verifyAccessToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Warranty types retrieved successfully",
    data: warrantyTypes,
  });
});

router.get("/periods", verifyAccessToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Warranty periods retrieved successfully",
    data: warrantyPeriods,
  });
});

export default router;
