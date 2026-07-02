-- CreateTable
CREATE TABLE "content_post" (
    "contentId" INTEGER NOT NULL,
    "contentTypeId" INTEGER NOT NULL,
    "pageName" TEXT NOT NULL,
    "slug" TEXT,
    "featuredImage" TEXT,
    "pageDescription" TEXT,
    "others" TEXT,
    "iconPath" TEXT,
    "ip" TEXT,
    "isActive" TEXT,
    "displayOrder" INTEGER,
    "isUrlStatus" TEXT,
    "showInHomePage" TEXT,
    "contentTypeName" TEXT,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "metaLongDescription" TEXT,
    "ogType" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogUrl" TEXT,
    "ogImgUrl" TEXT,

    CONSTRAINT "content_post_pkey" PRIMARY KEY ("contentId")
);
