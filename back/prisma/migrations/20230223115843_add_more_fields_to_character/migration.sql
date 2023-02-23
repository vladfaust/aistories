/*
  Warnings:

  - Added the required column `privateSynopsis` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicSynopsis` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "privateSynopsis" TEXT NOT NULL,
ADD COLUMN     "publicSynopsis" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "promptTemplate" DROP NOT NULL;
