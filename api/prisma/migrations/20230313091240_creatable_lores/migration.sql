-- AlterTable
ALTER TABLE "Lore"
ADD COLUMN "creatorId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "public" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "imageUrl";

-- Update existing rows with default value
UPDATE "Lore" SET "creatorId" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
);

-- Remove default value
ALTER TABLE "Lore" ALTER COLUMN "creatorId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Lore" ADD CONSTRAINT "Lore_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
