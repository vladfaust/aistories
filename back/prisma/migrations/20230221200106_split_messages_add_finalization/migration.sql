/*
  Warnings:

  - You are about to drop the column `actorId` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `actorId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Actor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TextMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_actorId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "TextMessage" DROP CONSTRAINT "TextMessage_actorId_fkey";

-- DropForeignKey
ALTER TABLE "TextMessage" DROP CONSTRAINT "TextMessage_chatId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_actorId_fkey";

-- DropIndex
DROP INDEX "Character_actorId_key";

-- DropIndex
DROP INDEX "User_actorId_key";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "actorId",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Character_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "actorId",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Actor";

-- DropTable
DROP TABLE "TextMessage";

-- CreateTable
CREATE TABLE "UserMessage" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterMessage" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "text" TEXT,
    "finalized" BOOLEAN NOT NULL,
    "pid" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMessage" ADD CONSTRAINT "CharacterMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMessage" ADD CONSTRAINT "CharacterMessage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
