-- CreateTable
CREATE TABLE "blog_categories" (
    "blogCategoryId" INTEGER NOT NULL,
    "blogCategoryName" TEXT NOT NULL,
    "blogCatUrl" TEXT,
    "isActive" TEXT,
    "featureImagePath" TEXT,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("blogCategoryId")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "postId" INTEGER NOT NULL,
    "postCategoryId" INTEGER NOT NULL,
    "postTitle" TEXT NOT NULL,
    "postDescription" TEXT,
    "featureImagePath" TEXT,
    "publishDatetime" TEXT,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "metaAuthor" TEXT,
    "ogType" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogUrl" TEXT,
    "ogImgUrl" TEXT,
    "isApproved" BOOLEAN,
    "isActive" TEXT,
    "externalLink" TEXT,
    "blogPostUrl" TEXT,
    "ip" TEXT,
    "blogCategoryName" TEXT,
    "createDate" TEXT,
    "adminName" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("postId")
);
