-- AlterTable
ALTER TABLE "AiFlag" ADD COLUMN     "postId" TEXT;

-- AddForeignKey
ALTER TABLE "AiFlag" ADD CONSTRAINT "AiFlag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
