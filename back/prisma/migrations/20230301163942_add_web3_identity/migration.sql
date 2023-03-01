/*
  Warnings:

  - You are about to drop the column `evmAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `OnChainEnergyPurchase` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OnChainEnergyPurchase" DROP CONSTRAINT "OnChainEnergyPurchase_userId_fkey";

-- DropIndex
DROP INDEX "User_evmAddress_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "evmAddress",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TRIGGER "OnChainEnergyPurchaseTrigger" ON "OnChainEnergyPurchase";
DROP FUNCTION "OnChainEnergyPurchaseNotify";
DROP TABLE "OnChainEnergyPurchase";

-- CreateTable
CREATE TABLE "Web3Identity" (
    "address" BYTEA NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Web3Identity_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Web3EnergyPurchase" (
    "address" BYTEA NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" BYTEA NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "energy" INTEGER NOT NULL,
    "value" BYTEA NOT NULL,

    CONSTRAINT "Web3EnergyPurchase_pkey" PRIMARY KEY ("blockNumber","logIndex")
);
CREATE OR REPLACE FUNCTION "Web3EnergyPurchaseNotify"()
RETURNS trigger
AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      PERFORM pg_notify('Web3EnergyPurchaseInsert', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'UPDATE') THEN
      PERFORM pg_notify('Web3EnergyPurchaseUpdate', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'DELETE') THEN
      PERFORM pg_notify('Web3EnergyPurchaseDelete', row_to_json(OLD)::text);
    END IF;
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Web3EnergyPurchaseTrigger"
AFTER INSERT OR UPDATE OR DELETE ON "Web3EnergyPurchase"
FOR EACH ROW EXECUTE PROCEDURE "Web3EnergyPurchaseNotify"();

-- CreateIndex
CREATE UNIQUE INDEX "Web3Identity_address_userId_key" ON "Web3Identity"("address", "userId");

-- AddForeignKey
ALTER TABLE "Web3Identity" ADD CONSTRAINT "Web3Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Web3EnergyPurchase" ADD CONSTRAINT "Web3EnergyPurchase_address_fkey" FOREIGN KEY ("address") REFERENCES "Web3Identity"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
