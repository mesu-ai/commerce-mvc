-- CreateTable
CREATE TABLE "brands" (
    "brandId" INTEGER NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandDetails" TEXT,
    "isActive" TEXT,
    "brandLogo" TEXT,
    "categoryId" INTEGER,
    "brandUrl" TEXT,
    "displayOrder" INTEGER,
    "shownHomePage" TEXT,
    "productCategories" JSONB,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("brandId")
);

-- CreateTable
CREATE TABLE "sellers" (
    "sellerId" INTEGER NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerContactNo" TEXT,
    "sellerEmail" TEXT,
    "sellerPassword" TEXT,
    "shopId" INTEGER,
    "roleId" INTEGER,
    "sellerPwdSalt" TEXT,
    "sellerImageUrl" TEXT,
    "sellerPresentAddress" TEXT,
    "sellerPermanentAddress" TEXT,
    "isActive" TEXT,
    "sellerAcNo" TEXT,
    "isDelete" TEXT,
    "shopName" TEXT,
    "sellerTypeId" INTEGER,
    "shopLogoUrl" TEXT,
    "shopDescription" TEXT,
    "binNo" TEXT,
    "shopCity" TEXT,
    "shopState" TEXT,
    "shopZipCode" TEXT,
    "shopAddress" TEXT,
    "ownerName" TEXT,
    "ownerNidUrl" TEXT,
    "bussinessDocUrl" TEXT,
    "shopBannerUrl" TEXT,
    "shopUrl" TEXT,
    "isVerified" TEXT,
    "isSellerDelivered" TEXT,
    "sellerCurrency" TEXT,
    "countryId" INTEGER,
    "currency" TEXT,
    "sellerAddresses" JSONB,
    "sellerBankAccount" JSONB,
    "sellerReturnPolicie" JSONB,
    "bussinessType" JSONB,
    "nidBackDoc" TEXT,
    "tradeLicenseDoc" TEXT,
    "tinNoDoc" TEXT,
    "binNoDoc" TEXT,
    "dbIdDoc" TEXT,
    "actApprovedBy" TEXT,
    "actApprovedStatus" TEXT,
    "actApprovedDate" TEXT,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "ogType" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogUrl" TEXT,
    "ogImgUrl" TEXT,
    "assignVendor" INTEGER,
    "assignVendorName" TEXT,
    "additionalDocuments" JSONB,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("sellerId")
);

-- CreateTable
CREATE TABLE "shops" (
    "shopId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("shopId")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT,
    "permissions" TEXT[],

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "status" TEXT,
    "gender" TEXT,
    "mobileNo" TEXT,
    "department" TEXT,
    "nid" TEXT,
    "photo" TEXT,
    "permissions" TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "column_settings" (
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "disabled" BOOLEAN,
    "isVisible" BOOLEAN,

    CONSTRAINT "column_settings_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "warranty_types" (
    "warrantyTypeId" INTEGER NOT NULL,
    "warrantyTypeName" TEXT NOT NULL,
    "warrantyTypeDetails" TEXT,
    "isActive" TEXT,
    "status" TEXT,
    "isApprove" TEXT,
    "createBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "updateDate" TEXT,

    CONSTRAINT "warranty_types_pkey" PRIMARY KEY ("warrantyTypeId")
);

-- CreateTable
CREATE TABLE "warranty_periods" (
    "warrantyPeriodId" INTEGER NOT NULL,
    "warrantyPeriodName" TEXT NOT NULL,
    "warrantyPeriodDetails" TEXT,
    "isActive" TEXT,
    "isApprove" TEXT,
    "status" TEXT,
    "createBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "updateDate" TEXT,

    CONSTRAINT "warranty_periods_pkey" PRIMARY KEY ("warrantyPeriodId")
);

-- CreateTable
CREATE TABLE "size_attributes" (
    "attributeId" INTEGER NOT NULL,
    "attributeName" TEXT NOT NULL,
    "displayOrder" INTEGER,
    "isActive" TEXT,
    "createdBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "updateDate" TEXT,

    CONSTRAINT "size_attributes_pkey" PRIMARY KEY ("attributeId")
);

-- CreateTable
CREATE TABLE "size_charts" (
    "sizeChartId" INTEGER NOT NULL,
    "chartName" TEXT NOT NULL,
    "chartCode" TEXT,
    "sizeTemplateId" INTEGER,
    "variantId" INTEGER,
    "variantName" TEXT,
    "isIntSize" TEXT,
    "modelImageTitle" TEXT,
    "modelImagePath" TEXT,
    "modelImageDesc" TEXT,
    "sizeMesurementTitle" TEXT,
    "sizeMesurementDesc" TEXT,
    "mesurementImagePath" TEXT,
    "categoryId" INTEGER,
    "isActive" TEXT,
    "isAutoConvert" TEXT,
    "isIntAutoConvert" TEXT,
    "ip" TEXT,
    "sizeChartMeasurements" JSONB,

    CONSTRAINT "size_charts_pkey" PRIMARY KEY ("sizeChartId")
);

-- CreateTable
CREATE TABLE "variant_attributes" (
    "productVariantId" INTEGER NOT NULL,
    "variantName" TEXT NOT NULL,
    "variantDescription" TEXT,
    "variantSetupTempleteId" INTEGER,
    "variantDisplayTempleteId" INTEGER,
    "isActive" TEXT,
    "isDelete" TEXT,
    "imgChgVariant" TEXT,
    "displayOrder" INTEGER,
    "createdBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "updateDate" TEXT,

    CONSTRAINT "variant_attributes_pkey" PRIMARY KEY ("productVariantId")
);

-- CreateTable
CREATE TABLE "variant_attribute_values" (
    "id" SERIAL NOT NULL,
    "variantOptionId" INTEGER NOT NULL,
    "variantOptionName" TEXT,
    "variantOptionValue" TEXT,
    "productVariantId" INTEGER,
    "variantName" TEXT,
    "displayOrder" INTEGER,

    CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_category_combinations" (
    "id" SERIAL NOT NULL,
    "variantOptionId" INTEGER,
    "productCategoryId" INTEGER,
    "productVariantId" INTEGER,
    "variantOptionText" TEXT,
    "variantRemark" TEXT,
    "variantTempleteId" INTEGER,
    "variantOptionValue" TEXT,
    "isDelete" TEXT,
    "isCommon" TEXT,
    "categoryName" TEXT,
    "variantName" TEXT,
    "displayOrder" INTEGER,
    "variantOptionValueId" INTEGER,

    CONSTRAINT "variant_category_combinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "variant_attribute_values_variantOptionId_idx" ON "variant_attribute_values"("variantOptionId");

-- CreateIndex
CREATE INDEX "variant_attribute_values_productVariantId_idx" ON "variant_attribute_values"("productVariantId");

-- CreateIndex
CREATE INDEX "variant_category_combinations_productCategoryId_idx" ON "variant_category_combinations"("productCategoryId");

-- CreateIndex
CREATE INDEX "variant_category_combinations_productVariantId_idx" ON "variant_category_combinations"("productVariantId");

-- CreateIndex
CREATE INDEX "variant_category_combinations_variantOptionId_idx" ON "variant_category_combinations"("variantOptionId");
