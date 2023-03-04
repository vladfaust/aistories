/*
  Warnings:

  - You are about to drop the column `buffer` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `busy` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `nextCharId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `pid` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `checkpoint` on the `StoryMemory` table. All the data in the column will be lost.
  - Added the required column `tokenUsage` to the `StoryContent` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `StoryContent` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tokenUsage` to the `StoryMemory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StoryMemory" DROP CONSTRAINT "StoryMemory_checkpoint_fkey";

-- DropIndex
DROP INDEX "Story_pid_key";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "buffer",
DROP COLUMN "busy",
DROP COLUMN "nextCharId",
DROP COLUMN "pid",
ADD COLUMN     "checkpoint" INTEGER,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "StoryContent" ADD COLUMN     "tokenUsage" INTEGER NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- AlterTable
ALTER TABLE "StoryMemory" DROP COLUMN "checkpoint",
ADD COLUMN     "tokenUsage" INTEGER NOT NULL;
