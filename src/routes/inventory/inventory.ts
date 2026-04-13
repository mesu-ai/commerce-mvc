import { verifyAccessToken } from "../../middleware/auth.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", verifyAccessToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Inventory retrived successfully",
    data: {
      // barcode: "558594",
      // salePrice: 1725,
      // quantity: 0,
      // currentStock: 1,
      // discountPercentage: 70,
      // startingDate: "2026-01-01T12:00:00",
      // expiringDate: "2026-12-31T12:00:00",
      // productStyle: "SRK517RA",
      // mainStyle: "SRK517R",
      // subStyle: "SRK517RA",

      barcode: "564790",
      salePrice: 2035,
      quantity: 0,
      currentStock: 8,
      discountPercentage: 70,
      startingDate: "2026-01-07T12:00:00",
      expiringDate: "2026-12-31T12:00:00",
      productStyle: "SRKWCO2WA",
      mainStyle: "SRKWCO2W",
      subStyle: "SRKWCO2WA",
    },
  });
});

export default router;
