/*
  Warnings:

  - You are about to drop the column `setup` on the `Story` table. All the data in the column will be lost.
  - Added the required column `collectionId` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionId` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "collectionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "setup",
ADD COLUMN     "collectionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "CharacterCollection" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterCollection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CharacterCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CharacterCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
