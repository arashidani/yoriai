-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'RESOLVED', 'HIDDEN');

-- AlterTable
ALTER TABLE "AiFlag" ADD COLUMN     "answerId" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "answerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postAnonymousProfileId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "PostAnonymousProfile" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "anonymousProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAnonymousProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT,
    "postAnonymousProfileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "hiddenByUserId" TEXT,
    "hiddenReason" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerLike" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostAnonymousProfile_postId_userId_key" ON "PostAnonymousProfile"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAnonymousProfile_postId_anonymousProfileId_key" ON "PostAnonymousProfile"("postId", "anonymousProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_authorId_idempotencyKey_key" ON "Answer"("authorId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionLike_postId_userId_key" ON "QuestionLike"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerLike_answerId_userId_key" ON "AnswerLike"("answerId", "userId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_postAnonymousProfileId_fkey" FOREIGN KEY ("postAnonymousProfileId") REFERENCES "PostAnonymousProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnonymousProfile" ADD CONSTRAINT "PostAnonymousProfile_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnonymousProfile" ADD CONSTRAINT "PostAnonymousProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnonymousProfile" ADD CONSTRAINT "PostAnonymousProfile_anonymousProfileId_fkey" FOREIGN KEY ("anonymousProfileId") REFERENCES "AnonymousProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_postAnonymousProfileId_fkey" FOREIGN KEY ("postAnonymousProfileId") REFERENCES "PostAnonymousProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_hiddenByUserId_fkey" FOREIGN KEY ("hiddenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLike" ADD CONSTRAINT "QuestionLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLike" ADD CONSTRAINT "QuestionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerLike" ADD CONSTRAINT "AnswerLike_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerLike" ADD CONSTRAINT "AnswerLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFlag" ADD CONSTRAINT "AiFlag_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
