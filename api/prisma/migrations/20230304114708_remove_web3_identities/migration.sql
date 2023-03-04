/*
  Warnings:

  - You are about to drop the `Web3Identity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Web3Identity" DROP CONSTRAINT "Web3Identity_userId_fkey";

-- DropTable
DROP TABLE "Web3Identity";
