/*
  Warnings:

  - You are about to drop the column `model` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `privateSynopsis` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `promptTemplate` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `publicSynopsis` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `summarizerTemplate` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `chatId` on the `CharacterMessage` table. All the data in the column will be lost.
  - You are about to drop the column `finalized` on the `CharacterMessage` table. All the data in the column will be lost.
  - You are about to drop the column `pid` on the `CharacterMessage` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `CharacterMessage` table. All the data in the column will be lost.
  - You are about to drop the column `chatId` on the `UserMessage` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `UserMessage` table. All the data in the column will be lost.
  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `personality` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storyId` to the `CharacterMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `UserMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storyId` to the `UserMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CharacterMessage" DROP CONSTRAINT "CharacterMessage_chatId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_chatId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessage" DROP CONSTRAINT "UserMessage_chatId_fkey";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "model",
DROP COLUMN "privateSynopsis",
DROP COLUMN "promptTemplate",
DROP COLUMN "publicSynopsis",
DROP COLUMN "summarizerTemplate",
ADD COLUMN     "personality" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CharacterMessage" DROP COLUMN "chatId",
DROP COLUMN "finalized",
DROP COLUMN "pid",
DROP COLUMN "text",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "storyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserMessage" DROP COLUMN "chatId",
DROP COLUMN "text",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "storyId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Chat";

-- DropTable
DROP TABLE "ChatSession";

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "name" TEXT,
    "fabula" TEXT,
    "summary" TEXT,
    "buffer" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "busy" BOOLEAN NOT NULL,
    "pid" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_pid_key" ON "Story"("pid");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMessage" ADD CONSTRAINT "CharacterMessage_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddTrigger
CREATE OR REPLACE FUNCTION "CharacterMessageNotify"()
RETURNS trigger
AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      PERFORM pg_notify('CharacterMessageInsert', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'UPDATE') THEN
      PERFORM pg_notify('CharacterMessageUpdate', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'DELETE') THEN
      PERFORM pg_notify('CharacterMessageDelete', row_to_json(OLD)::text);
    END IF;
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "CharacterMessageTrigger"
AFTER INSERT OR UPDATE OR DELETE ON "CharacterMessage"
FOR EACH ROW EXECUTE PROCEDURE "CharacterMessageNotify"();
