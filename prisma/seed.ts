// Loads the mock data from src/data into the real database.
// Run with:  npm run db:seed
import "dotenv/config";
import { prisma } from "../src/config/prisma";
import { categories } from "../src/data/category";
import { products } from "../src/data/product";
import { brands } from "../src/data/brand";
import { sellerData } from "../src/data/seller";
import { shops } from "../src/data/shop";
import { roles } from "../src/data/role";
import { users } from "../src/data/user";
import { columns } from "../src/data/column";
import { warrantyTypes, warrantyPeriods } from "../src/data/warranty";
import { sizeAttributes } from "../src/data/sizeAttribute";
import { sizeCharts } from "../src/data/sizeChart";
import { variantAttributes } from "../src/data/variantAttribute";
import { variantAttributeValues } from "../src/data/variantAttributeValue";
import { variantCategoryCombinations } from "../src/data/variantCategoryCombination";

// Clears a table then bulk-inserts the rows in chunks (Postgres has a limit on
// the number of bind parameters per query, so we batch large datasets).
async function reseed(name: string, model: any, data: any[]) {
  await model.deleteMany({});
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    await model.createMany({ data: data.slice(i, i + batchSize) });
  }
  console.log(`  ${name}: ${data.length}`);
}

async function main() {
  console.log("Seeding database...");

  await reseed("categories", prisma.category, categories);
  await reseed("products", prisma.product, products);
  await reseed("brands", prisma.brand, brands);
  await reseed("sellers", prisma.seller, sellerData);
  await reseed("shops", prisma.shop, shops);
  await reseed("roles", prisma.role, roles);
  await reseed("users", prisma.user, users);
  await reseed("columnSettings", prisma.columnSetting, columns);
  await reseed("warrantyTypes", prisma.warrantyType, warrantyTypes);
  await reseed("warrantyPeriods", prisma.warrantyPeriod, warrantyPeriods);
  await reseed("sizeAttributes", prisma.sizeAttribute, sizeAttributes);
  await reseed("sizeCharts", prisma.sizeChart, sizeCharts);
  await reseed("variantAttributes", prisma.variantAttribute, variantAttributes);
  await reseed(
    "variantAttributeValues",
    prisma.variantAttributeValue,
    variantAttributeValues,
  );
  await reseed(
    "variantCategoryCombinations",
    prisma.variantCategoryCombination,
    variantCategoryCombinations,
  );

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
