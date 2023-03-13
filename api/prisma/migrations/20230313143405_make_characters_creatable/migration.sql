/*
  Warnings:

  - You are about to drop the column `imagePreviewUrl` on the `Character` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "imagePreviewUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creatorId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows with default value
UPDATE "Character" SET "creatorId" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
);

-- Remove default value
ALTER TABLE "Character" ALTER COLUMN "creatorId" DROP DEFAULT;
ALTER TABLE "Character" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
