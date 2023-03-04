/*
  Warnings:

  - The primary key for the `OAuth2Identity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Story` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `StoryMemory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "OAuth2Identity" DROP CONSTRAINT "OAuth2Identity_userId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_userId_fkey";

-- DropForeignKey
ALTER TABLE "StoryContent" DROP CONSTRAINT "StoryContent_storyId_fkey";

-- DropForeignKey
ALTER TABLE "StoryContent" DROP CONSTRAINT "StoryContent_userId_fkey";

-- DropForeignKey
ALTER TABLE "StoryMemory" DROP CONSTRAINT "StoryMemory_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Web3Identity" DROP CONSTRAINT "Web3Identity_userId_fkey";

-- DropForeignKey
ALTER TABLE "_CharacterToStory" DROP CONSTRAINT "_CharacterToStory_B_fkey";

-- AlterTable
ALTER TABLE "OAuth2Identity" DROP CONSTRAINT "OAuth2Identity_pkey",
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "OAuth2Identity_pkey" PRIMARY KEY ("providerId", "userId");

-- AlterTable
ALTER TABLE "Story" DROP CONSTRAINT "Story_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Story_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Story_id_seq";

-- AlterTable
ALTER TABLE "StoryContent" ALTER COLUMN "storyId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "StoryMemory" DROP CONSTRAINT "StoryMemory_pkey",
ALTER COLUMN "storyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "StoryMemory_pkey" PRIMARY KEY ("storyId", "charId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "Web3Identity" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_CharacterToStory" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Web3Identity" ADD CONSTRAINT "Web3Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuth2Identity" ADD CONSTRAINT "OAuth2Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMemory" ADD CONSTRAINT "StoryMemory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToStory" ADD CONSTRAINT "_CharacterToStory_B_fkey" FOREIGN KEY ("B") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
