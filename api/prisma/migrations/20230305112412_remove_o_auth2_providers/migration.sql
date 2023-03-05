/*
  Warnings:

  - You are about to drop the `OAuth2Provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OAuth2Identity" DROP CONSTRAINT "OAuth2Identity_providerId_fkey";

-- DropTable
DROP TABLE "OAuth2Provider";
