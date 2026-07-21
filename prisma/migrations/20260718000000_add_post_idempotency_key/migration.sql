-- Store the client-generated key with each post so the database can reject
-- concurrent retries of the same create-post operation.
ALTER TABLE "Post" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Post_authorId_idempotencyKey_key"
ON "Post"("authorId", "idempotencyKey");
