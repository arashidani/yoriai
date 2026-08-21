CREATE TABLE "HirobaMembership" (
    "userId" TEXT NOT NULL,
    "hirobaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HirobaMembership_pkey" PRIMARY KEY ("userId", "hirobaId")
);

ALTER TABLE "HirobaMembership"
ADD CONSTRAINT "HirobaMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HirobaMembership"
ADD CONSTRAINT "HirobaMembership_hirobaId_fkey"
FOREIGN KEY ("hirobaId") REFERENCES "Hiroba"("id") ON DELETE CASCADE ON UPDATE CASCADE;
