import { shops } from "../../data/shop";
import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  const { keyword } = req.query;
  const searchKeyword = keyword && keyword?.toString().trim().toLowerCase();

  const matchShops = searchKeyword
    ? shops?.filter((s) => s.shopName.toLowerCase().includes(searchKeyword))
    : shops;

  res.status(200).json({
    success: true,
    message: "Shop retrieved successfully",
    data: matchShops,
  });
});

export default router;

