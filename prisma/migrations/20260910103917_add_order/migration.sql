-- CreateTable
CREATE TABLE "orders" (
    "orderProfileId" INTEGER NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "couponAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingAddressId" INTEGER,
    "shippingAddress" TEXT,
    "orderGuid" TEXT,
    "customerCurrencyCode" TEXT,
    "currencyRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "orderSubtotalAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderSubtotalDiscountAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVatFlatAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalShippingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherChargeTypeId" INTEGER NOT NULL DEFAULT 0,
    "otherChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatusId" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethodId" INTEGER NOT NULL DEFAULT 0,
    "paymentMethodName" TEXT,
    "payAccountNo" TEXT,
    "cusContactNo" TEXT,
    "isActive" TEXT NOT NULL DEFAULT 'Y',
    "statusId" INTEGER NOT NULL,
    "statusName" TEXT NOT NULL,
    "voucherAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voucherCode" TEXT,
    "createdBy" TEXT,
    "createDate" TEXT,
    "packageWeight" DOUBLE PRECISION,
    "cusEmail" TEXT,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingAddress" TEXT,
    "isGuestOrder" TEXT,
    "burnAmount" DOUBLE PRECISION,
    "couponCode" TEXT,
    "shippingVoucherAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingVoucherCode" TEXT,
    "applyVoucherOn" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("orderProfileId")
);

-- CreateTable
CREATE TABLE "shop_wise_orders" (
    "shopWiseOrderId" INTEGER NOT NULL,
    "orderProfileId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "totalSalesAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "couponAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "totalDiscountFlatAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVatFlatAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherChargeTypeId" INTEGER NOT NULL DEFAULT 0,
    "otherChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayableAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSubTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" TEXT NOT NULL DEFAULT 'Y',
    "statusId" INTEGER NOT NULL,
    "statusName" TEXT NOT NULL,
    "commissionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactNo" TEXT,
    "presentAddress" TEXT,
    "permanentAddress" TEXT,
    "createdBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL DEFAULT 0,
    "cusEmail" TEXT,
    "updateDate" TEXT,
    "orderDetails" JSONB,
    "sellerProfile" JSONB,
    "orderTrackingDetails" JSONB,
    "packageNo" TEXT,
    "packageWeight" DOUBLE PRECISION,
    "paymentStatusId" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethodId" INTEGER NOT NULL DEFAULT 0,
    "paymentMethodName" TEXT,
    "voucherCode" TEXT,
    "orderSourch" TEXT,
    "voucherPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voucherAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingVoucherCode" TEXT,
    "shippingVoucherAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPackageWeight" DOUBLE PRECISION,
    "payAccountNo" TEXT,
    "tranNo" TEXT,
    "paymentDate" TEXT,
    "customerOrderNote" TEXT,
    "burnAmount" DOUBLE PRECISION,
    "applyVoucherOn" TEXT,
    "totalDisBurnVoucherAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "paymentInfo" JSONB,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "shop_wise_orders_pkey" PRIMARY KEY ("shopWiseOrderId")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "orderPaymentId" INTEGER NOT NULL,
    "orderProfileId" INTEGER NOT NULL,
    "paymentStatusId" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "paymentMethodName" TEXT NOT NULL,
    "payAccountNo" TEXT,
    "tranNo" TEXT,
    "paymentDate" TEXT,
    "emiBankName" TEXT,
    "emiBankTenure" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("orderPaymentId")
);

-- CreateIndex
CREATE INDEX "orders_shopId_idx" ON "orders"("shopId");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "shop_wise_orders_orderProfileId_idx" ON "shop_wise_orders"("orderProfileId");

-- CreateIndex
CREATE INDEX "shop_wise_orders_shopId_idx" ON "shop_wise_orders"("shopId");

-- CreateIndex
CREATE INDEX "order_payments_orderProfileId_idx" ON "order_payments"("orderProfileId");

-- AddForeignKey
ALTER TABLE "shop_wise_orders" ADD CONSTRAINT "shop_wise_orders_orderProfileId_fkey" FOREIGN KEY ("orderProfileId") REFERENCES "orders"("orderProfileId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_orderProfileId_fkey" FOREIGN KEY ("orderProfileId") REFERENCES "orders"("orderProfileId") ON DELETE CASCADE ON UPDATE CASCADE;
