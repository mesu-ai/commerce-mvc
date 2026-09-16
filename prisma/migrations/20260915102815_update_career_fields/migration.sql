/*
  Warnings:

  - The primary key for the `careers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `careers` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `careers` table. All the data in the column will be lost.
  - Added the required column `jobTitle` to the `careers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "careers" DROP CONSTRAINT "careers_pkey",
DROP COLUMN "id",
DROP COLUMN "title",
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "jobId" SERIAL NOT NULL,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "metaTag" JSONB,
ADD COLUMN     "ogTag" JSONB,
ADD COLUMN     "slug" TEXT,
ADD CONSTRAINT "careers_pkey" PRIMARY KEY ("jobId");
