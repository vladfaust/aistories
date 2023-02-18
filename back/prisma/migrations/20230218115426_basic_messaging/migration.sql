-- CreateTable
CREATE TABLE "HumanMessage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,

    CONSTRAINT "HumanMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "humanMessageId" INTEGER NOT NULL,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BotMessage" ADD CONSTRAINT "BotMessage_humanMessageId_fkey" FOREIGN KEY ("humanMessageId") REFERENCES "HumanMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
