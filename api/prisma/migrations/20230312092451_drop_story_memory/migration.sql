/*
  Warnings:

  - You are about to drop the `StoryMemory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StoryMemory" DROP CONSTRAINT "StoryMemory_charId_fkey";

-- DropForeignKey
ALTER TABLE "StoryMemory" DROP CONSTRAINT "StoryMemory_storyId_fkey";

-- DropTable
DROP TABLE "StoryMemory";
