/*
  Warnings:

  - Added the required column `energyCost` to the `UserMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserMessage" ADD COLUMN     "energyCost" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "OnChainEnergyPurchase" (
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" BYTEA NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "value" BYTEA NOT NULL,

    CONSTRAINT "OnChainEnergyPurchase_pkey" PRIMARY KEY ("blockNumber","logIndex")
);

-- AddForeignKey
ALTER TABLE "OnChainEnergyPurchase" ADD CONSTRAINT "OnChainEnergyPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTrigger
CREATE OR REPLACE FUNCTION "OnChainEnergyPurchaseNotify"()
RETURNS trigger
AS $$
  BEGIN
    PERFORM pg_notify('OnChainEnergyPurchaseChannel', row_to_json(NEW)::text);
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "OnChainEnergyPurchaseTrigger"
AFTER INSERT OR UPDATE ON "OnChainEnergyPurchase"
FOR EACH ROW EXECUTE PROCEDURE "OnChainEnergyPurchaseNotify"();

-- CreateTrigger
CREATE OR REPLACE FUNCTION "UserMessageNotify"()
RETURNS trigger
AS $$
  BEGIN
    PERFORM pg_notify('UserMessageChannel', row_to_json(NEW)::text);
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "UserMessageTrigger"
AFTER INSERT OR UPDATE ON "UserMessage"
FOR EACH ROW EXECUTE PROCEDURE "UserMessageNotify"();
