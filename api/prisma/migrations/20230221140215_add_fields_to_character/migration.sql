/*
  Warnings:

  - Added the required column `about` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagePreviewUrl` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptTemplate` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "about" TEXT NOT NULL,
ADD COLUMN     "imagePreviewUrl" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "promptTemplate" TEXT NOT NULL,
ADD COLUMN     "summarizerTemplate" TEXT;
