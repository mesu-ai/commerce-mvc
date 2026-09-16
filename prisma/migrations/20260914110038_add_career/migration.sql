-- CreateTable
CREATE TABLE "careers" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "vacancy" INTEGER,
    "experience" TEXT,
    "salary" TEXT,
    "deadline" TEXT,
    "location" TEXT,
    "email" TEXT,
    "context" TEXT,
    "requirements" TEXT,
    "additionalRequirements" TEXT,
    "skills" TEXT,
    "qualifications" TEXT,
    "benefits" TEXT,
    "shortListed" INTEGER DEFAULT 0,
    "viewed" INTEGER DEFAULT 0,
    "notViewed" INTEGER DEFAULT 0,
    "applicants" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'Y',

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);
