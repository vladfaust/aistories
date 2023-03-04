/*
  Warnings:

  - You are about to drop the column `erc1155Address` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `erc1155Id` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `erc1155NftUri` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "erc1155Address",
DROP COLUMN "erc1155Id",
DROP COLUMN "erc1155NftUri";
