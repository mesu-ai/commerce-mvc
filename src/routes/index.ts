import { Router, Request, Response } from "express";
import userRoutes from "./users/users";
import productRoutes from "./products/products";
import authRouters from "./auth/auth";
import roleRouters from "./roles/roles";
import categoryRouters from "./categories/categories";
import shopRouters from "./shops/shops";
import inventoryRouters from "./inventory/inventory";
import columnsRoutes from "./columns/columns";
import sellersRoutes from "./sellers/sellers";
import brandsRoutes from "./brands/brands";
import variantsRoutes from "./variants/variants";
import warrantyRoutes from "./warranty/warranty";
import SizeRoutes from "./sizes/sizes";
import contentsRoutes from "./contents/contents";

const router = Router();

// Mount different route modules
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/auth", authRouters);
router.use("/roles", roleRouters);
router.use("/categories", categoryRouters);
router.use("/shops", shopRouters);
router.use("/inventory", inventoryRouters);
router.use("/columns", columnsRoutes);
router.use("/sellers", sellersRoutes);
router.use("/brands", brandsRoutes);
router.use("/variants", variantsRoutes);
router.use("/warranty", warrantyRoutes);
router.use("/sizes", SizeRoutes);
router.use("/contents", contentsRoutes);


// Root API route
router.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Welcome to Express MVC API",
    version: "1.0.0",
    endpoints: {
      users: "/api/v1/users",
      products: "/api/v1/products",
      auth: "/api/v1/auth",
      roles: "/api/v1/roles",
      categories: "/api/v1/categories",
      shops: "/api/v1/shops",
      inventory: "/api/v1/inventory",
      columns: "/api/v1/columns",
      sellers: "/api/v1/sellers",
      brands: "/api/v1/brands",
      variants: "/api/v1/variants",
      warranty: "/api/v1/warranty",
      sizes: "/api/v1/sizes",
      contents: "/api/v1/contents",
    },
  });
});

export default router;
