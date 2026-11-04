-- CreateTable
CREATE TABLE "divisions" (
    "divisionId" INTEGER NOT NULL,
    "divisionName" TEXT NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("divisionId")
);

-- AlterTable
ALTER TABLE "city_with_area" ADD COLUMN "divisionId" INTEGER;

-- CreateIndex
CREATE INDEX "city_with_area_divisionId_idx" ON "city_with_area"("divisionId");

-- AddForeignKey
ALTER TABLE "city_with_area" ADD CONSTRAINT "city_with_area_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("divisionId") ON DELETE SET NULL ON UPDATE CASCADE;
