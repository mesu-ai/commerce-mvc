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
import { contentCategories } from "../src/data/contentCategory";
import { contentPosts } from "../src/data/contentPost";
import { redisCache } from "../src/data/redisCache";
import { blogCategories } from "../src/data/blogCategory";
import { blogPosts } from "../src/data/blogPost";
import { outlets } from "../src/data/outlet";
import { bannerDimensions } from "../src/data/bannerDimension";
import { bannerPlacements } from "../src/data/bannerPlacement";
import { bannerContents } from "../src/data/bannerContent";
import { customerAddresses } from "../src/data/customerAddress";
import { citiesWithAreas } from "../src/data/cityWithArea";
import { orders } from "../src/data/order";
import { careers } from "../src/data/career";
import { Prisma } from "@prisma/client";

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

// Products own variantCombinations (which in turn own options) as real
// relations now, so createMany can't nest them — create each product with
// its combinations/options in one nested write instead.
async function reseedProducts() {
  for (const { variantCombinations, createdAt, updatedAt, ...productFields } of products) {
    await prisma.product.create({
      data: {
        ...productFields,
        variantCombinations: {
          create: variantCombinations.map(({ options, startDate, endDate, ...combo }) => ({
            ...combo,
            startDate: startDate ? new Date(startDate) : startDate,
            endDate: endDate ? new Date(endDate) : endDate,
            options: { create: options },
          })),
        },
      },
    });
  }
  console.log(`  products: ${products.length}`);
}

// async function reseedBannerContents() {
//   await prisma.bannerImage.deleteMany({});
//   await prisma.bannerContent.deleteMany({});

//   const bannerContentRows = bannerContents.map(({ adsImages, ...banner }) => banner);
//   const bannerImageRows = bannerContents.flatMap(({ adsImages }) => adsImages);

//   const batchSize = 1000;
//   for (let i = 0; i < bannerContentRows.length; i += batchSize) {
//     await prisma.bannerContent.createMany({
//       data: bannerContentRows.slice(i, i + batchSize),
//     });
//   }

//   for (let i = 0; i < bannerImageRows.length; i += batchSize) {
//     await prisma.bannerImage.createMany({
//       data: bannerImageRows.slice(i, i + batchSize),
//     });
//   }

//   console.log(`  bannerContents: ${bannerContentRows.length}`);
//   console.log(`  bannerImages: ${bannerImageRows.length}`);
// }

// Orders own shopWiseOrders and paymentInfo as real relations, so createMany
// can't nest them — create each order with its rows in one nested write.
async function reseedOrders() {
  await prisma.order.deleteMany({});
  for (const { shopWiseOrders, paymentInfo, ...orderFields } of orders) {
    await prisma.order.create({
      data: {
        ...orderFields,
        shopWiseOrders: {
          create: shopWiseOrders.map(
            ({ orderProfileId, orderDetails, sellerProfile, orderTrackingDetails, paymentInfo: shopPaymentInfo, ...shopWiseOrder }) => ({
              ...shopWiseOrder,
              orderDetails: orderDetails ?? Prisma.JsonNull,
              sellerProfile: sellerProfile ?? Prisma.JsonNull,
              orderTrackingDetails: orderTrackingDetails ?? Prisma.JsonNull,
              paymentInfo: shopPaymentInfo ?? Prisma.JsonNull,
            }),
          ),
        },
        paymentInfo: { create: paymentInfo },
      },
    });
  }
  console.log(`  orders: ${orders.length}`);
}

async function main() {
  console.log("Seeding database...");

  // Products FK-reference categories/shops/brands, so clear products first
  // (before those tables are touched) and only recreate products once
  // they've all been reseeded.
  await prisma.product.deleteMany({});

  await reseed("categories", prisma.category, categories);
  await reseed("brands", prisma.brand, brands);
  await reseed("sellers", prisma.seller, sellerData);
  await reseed("shops", prisma.shop, shops);
  await reseedProducts();
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
  await reseed("contentCategories", prisma.contentCategory, contentCategories);
  await reseed("contentPosts", prisma.contentPost, contentPosts);
  await reseed("cache", prisma.redisCache, redisCache);
  await reseed("blogCategories", prisma.blogCategory, blogCategories);
  await reseed("blogPosts", prisma.blogPost, blogPosts);
  await reseed("outlets", prisma.outlet, outlets);
  await reseed("bannerDimensions", prisma.bannerDimension, bannerDimensions);
  await reseed("bannerPlacements", prisma.bannerPlacement, bannerPlacements);
  await reseed("bannerContents", prisma.bannerContent, bannerContents);
  await reseed("customerAddresses", prisma.customerAddress, customerAddresses);
  await reseed("cityWithAreas", prisma.cityWithArea, citiesWithAreas);
  await reseedOrders();
  await reseed("careers", prisma.career, careers);
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
