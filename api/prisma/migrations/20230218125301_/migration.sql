/*
  Warnings:

  - You are about to drop the `BotMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HumanMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BotMessage" DROP CONSTRAINT "BotMessage_humanMessageId_fkey";

-- DropTable
DROP TABLE "BotMessage";

-- DropTable
DROP TABLE "HumanMessage";

-- CreateTable
CREATE TABLE "TextMessage" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextMessage_pkey" PRIMARY KEY ("id")
);
