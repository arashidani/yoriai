-- CreateEnum
CREATE TYPE "LunchPreference" AS ENUM ('NO_PREFERENCE', 'TEAM', 'ALONE');

-- CreateEnum
CREATE TYPE "DisplayNameColor" AS ENUM ('GREEN', 'YELLOW', 'BLUE', 'PURPLE', 'GRAY');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "username" VARCHAR(100),
ADD COLUMN "departmentId" TEXT,
ADD COLUMN "businessAreaId" TEXT,
ADD COLUMN "joinedYear" INTEGER,
ADD COLUMN "joinedMonth" INTEGER,
ADD COLUMN "lunchPreference" "LunchPreference",
ADD COLUMN "recommendedLunchSpot" VARCHAR(20),
ADD COLUMN "bio" VARCHAR(200),
ADD COLUMN "displayNameColor" "DisplayNameColor",
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD CONSTRAINT "User_joinedMonth_check" CHECK ("joinedMonth" IS NULL OR "joinedMonth" BETWEEN 1 AND 12);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBusinessSkill" (
    "userId" TEXT NOT NULL,
    "businessSkillId" TEXT NOT NULL,

    CONSTRAINT "UserBusinessSkill_pkey" PRIMARY KEY ("userId", "businessSkillId")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "userId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId", "interestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessArea_name_key" ON "BusinessArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSkill_name_key" ON "BusinessSkill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessAreaId_fkey" FOREIGN KEY ("businessAreaId") REFERENCES "BusinessArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBusinessSkill" ADD CONSTRAINT "UserBusinessSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBusinessSkill" ADD CONSTRAINT "UserBusinessSkill_businessSkillId_fkey" FOREIGN KEY ("businessSkillId") REFERENCES "BusinessSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
