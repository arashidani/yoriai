-- AlterTable
ALTER TABLE "AiFlag" ADD COLUMN     "hirobaAnswerId" TEXT,
ADD COLUMN     "hirobaPostId" TEXT;

-- CreateTable
CREATE TABLE "Hiroba" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hiroba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaPost" (
    "id" TEXT NOT NULL,
    "hirobaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "idempotencyKey" TEXT,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HirobaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaAnswer" (
    "id" TEXT NOT NULL,
    "hirobaPostId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "hiddenReason" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HirobaAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaPostLike" (
    "id" TEXT NOT NULL,
    "hirobaPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HirobaPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaAnswerLike" (
    "id" TEXT NOT NULL,
    "hirobaAnswerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HirobaAnswerLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaPostBookmark" (
    "id" TEXT NOT NULL,
    "hirobaPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HirobaPostBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HirobaPostTag" (
    "id" TEXT NOT NULL,
    "hirobaPostId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HirobaPostTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hiroba_slug_key" ON "Hiroba"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaPost_authorId_idempotencyKey_key" ON "HirobaPost"("authorId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaAnswer_authorId_idempotencyKey_key" ON "HirobaAnswer"("authorId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaPostLike_hirobaPostId_userId_key" ON "HirobaPostLike"("hirobaPostId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaAnswerLike_hirobaAnswerId_userId_key" ON "HirobaAnswerLike"("hirobaAnswerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaPostBookmark_hirobaPostId_userId_key" ON "HirobaPostBookmark"("hirobaPostId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HirobaPostTag_hirobaPostId_tagId_key" ON "HirobaPostTag"("hirobaPostId", "tagId");

-- AddForeignKey
ALTER TABLE "AiFlag" ADD CONSTRAINT "AiFlag_hirobaPostId_fkey" FOREIGN KEY ("hirobaPostId") REFERENCES "HirobaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFlag" ADD CONSTRAINT "AiFlag_hirobaAnswerId_fkey" FOREIGN KEY ("hirobaAnswerId") REFERENCES "HirobaAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPost" ADD CONSTRAINT "HirobaPost_hirobaId_fkey" FOREIGN KEY ("hirobaId") REFERENCES "Hiroba"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPost" ADD CONSTRAINT "HirobaPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaAnswer" ADD CONSTRAINT "HirobaAnswer_hirobaPostId_fkey" FOREIGN KEY ("hirobaPostId") REFERENCES "HirobaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaAnswer" ADD CONSTRAINT "HirobaAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostLike" ADD CONSTRAINT "HirobaPostLike_hirobaPostId_fkey" FOREIGN KEY ("hirobaPostId") REFERENCES "HirobaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostLike" ADD CONSTRAINT "HirobaPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaAnswerLike" ADD CONSTRAINT "HirobaAnswerLike_hirobaAnswerId_fkey" FOREIGN KEY ("hirobaAnswerId") REFERENCES "HirobaAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaAnswerLike" ADD CONSTRAINT "HirobaAnswerLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostBookmark" ADD CONSTRAINT "HirobaPostBookmark_hirobaPostId_fkey" FOREIGN KEY ("hirobaPostId") REFERENCES "HirobaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostBookmark" ADD CONSTRAINT "HirobaPostBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostTag" ADD CONSTRAINT "HirobaPostTag_hirobaPostId_fkey" FOREIGN KEY ("hirobaPostId") REFERENCES "HirobaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HirobaPostTag" ADD CONSTRAINT "HirobaPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
