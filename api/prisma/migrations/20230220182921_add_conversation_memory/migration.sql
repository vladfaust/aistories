-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "conversationBuffer" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "conversationSummary" TEXT NOT NULL DEFAULT '';
