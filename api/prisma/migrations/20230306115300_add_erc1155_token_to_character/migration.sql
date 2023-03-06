/*
  Warnings:

  - You are about to drop the column `erc1155Nft` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "erc1155Nft",
ADD COLUMN     "erc1155Token" TEXT;
