-- CreateTable
CREATE TABLE "outlets" (
    "outletId" INTEGER NOT NULL,
    "outletName" TEXT NOT NULL,
    "address" TEXT,
    "businessHours" TEXT,
    "businessHoursNote" TEXT,
    "contactNumOne" TEXT,
    "contactNumTwo" TEXT,
    "contactNumThree" TEXT,
    "outletImage" TEXT,
    "outletDirection" TEXT,
    "isActive" TEXT,
    "contacts" JSONB,

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("outletId")
);
