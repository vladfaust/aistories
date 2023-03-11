-- CreateTable
CREATE TABLE "Web3EnergyPurchase" (
    "userId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "value" BYTEA NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Web3EnergyPurchase_pkey" PRIMARY KEY ("blockNumber","logIndex")
);

-- AddForeignKey
ALTER TABLE "Web3EnergyPurchase" ADD CONSTRAINT "Web3EnergyPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
