/*
  Warnings:

  - You are about to drop the column `characterId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the `CharacterMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserMessage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nextCharId` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userMap` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CharacterMessage" DROP CONSTRAINT "CharacterMessage_characterId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterMessage" DROP CONSTRAINT "CharacterMessage_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessage" DROP CONSTRAINT "UserMessage_storyId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessage" DROP CONSTRAINT "UserMessage_userId_fkey";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "characterId",
DROP COLUMN "summary",
DROP COLUMN "userId",
ADD COLUMN     "charIds" INTEGER[],
ADD COLUMN     "nextCharId" INTEGER NOT NULL,
ADD COLUMN     "setup" TEXT,
ADD COLUMN     "userIds" INTEGER[],
ADD COLUMN     "userMap" TEXT NOT NULL;

-- DropTable
DROP TRIGGER "CharacterMessageTrigger" ON "CharacterMessage";
DROP FUNCTION "CharacterMessageNotify";
DROP TABLE "CharacterMessage";

-- DropTable
DROP TRIGGER "UserMessageTrigger" ON "UserMessage";
DROP FUNCTION "UserMessageNotify";
DROP TABLE "UserMessage";

-- CreateTable
CREATE TABLE "StoryContent" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "charId" INTEGER NOT NULL,
    "userId" INTEGER,
    "energyCost" INTEGER NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryContent_pkey" PRIMARY KEY ("id")
);
CREATE OR REPLACE FUNCTION "StoryContentNotify"()
RETURNS trigger
AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      PERFORM pg_notify('StoryContentInsert', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'UPDATE') THEN
      PERFORM pg_notify('StoryContentUpdate', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'DELETE') THEN
      PERFORM pg_notify('StoryContentDelete', row_to_json(OLD)::text);
    END IF;
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "StoryContentTrigger"
AFTER INSERT OR UPDATE OR DELETE ON "StoryContent"
FOR EACH ROW EXECUTE PROCEDURE "StoryContentNotify"();

-- CreateTable
CREATE TABLE "StoryMemory" (
    "storyId" INTEGER NOT NULL,
    "charId" INTEGER NOT NULL,
    "checkpoint" INTEGER NOT NULL,
    "memory" TEXT NOT NULL,

    CONSTRAINT "StoryMemory_pkey" PRIMARY KEY ("storyId","charId")
);

-- CreateTable
CREATE TABLE "_CharacterToStory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_StoryToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToStory_AB_unique" ON "_CharacterToStory"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToStory_B_index" ON "_CharacterToStory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_StoryToUser_AB_unique" ON "_StoryToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_StoryToUser_B_index" ON "_StoryToUser"("B");

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_charId_fkey" FOREIGN KEY ("charId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMemory" ADD CONSTRAINT "StoryMemory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMemory" ADD CONSTRAINT "StoryMemory_charId_fkey" FOREIGN KEY ("charId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMemory" ADD CONSTRAINT "StoryMemory_checkpoint_fkey" FOREIGN KEY ("checkpoint") REFERENCES "StoryContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToStory" ADD CONSTRAINT "_CharacterToStory_A_fkey" FOREIGN KEY ("A") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterToStory" ADD CONSTRAINT "_CharacterToStory_B_fkey" FOREIGN KEY ("B") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryToUser" ADD CONSTRAINT "_StoryToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryToUser" ADD CONSTRAINT "_StoryToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
