/*
  Warnings:

  - You are about to drop the column `userIds` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `userMap` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `energyCost` on the `StoryContent` table. All the data in the column will be lost.
  - You are about to drop the `Web3EnergyPurchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_StoryToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userCharId` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenLength` to the `StoryContent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Web3EnergyPurchase" DROP CONSTRAINT "Web3EnergyPurchase_address_fkey";

-- DropForeignKey
ALTER TABLE "_StoryToUser" DROP CONSTRAINT "_StoryToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_StoryToUser" DROP CONSTRAINT "_StoryToUser_B_fkey";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "userIds",
DROP COLUMN "userMap",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "userCharId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StoryContent" DROP COLUMN "energyCost",
ADD COLUMN     "tokenLength" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "openAiApiKey" TEXT;

-- DropTable
DROP TRIGGER "Web3EnergyPurchaseTrigger" ON "Web3EnergyPurchase";
DROP FUNCTION "Web3EnergyPurchaseNotify";
DROP TABLE "Web3EnergyPurchase";

-- DropTable
DROP TABLE "_StoryToUser";

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
