-- CreateTable
CREATE TABLE "redis_cache" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "expireTime" TEXT,

    CONSTRAINT "redis_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redis_cache_key_key" ON "redis_cache"("key");
