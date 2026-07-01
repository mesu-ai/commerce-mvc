-- CreateTable
CREATE TABLE "content_category" (
    "contentTypeId" INTEGER NOT NULL,
    "contentTypeName" TEXT NOT NULL,
    "isActive" TEXT,
    "ip" TEXT,
    "createdBy" TEXT,
    "createDate" TEXT,
    "updateBy" TEXT,
    "updateDate" TEXT,

    CONSTRAINT "content_category_pkey" PRIMARY KEY ("contentTypeId")
);
