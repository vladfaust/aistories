/*
  Warnings:

  - You are about to drop the column `erc1155Token` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "erc1155Token",
ADD COLUMN     "nftContractAddress" BYTEA,
ADD COLUMN     "nftTokenId" BYTEA,
ADD COLUMN     "nftUri" TEXT;
