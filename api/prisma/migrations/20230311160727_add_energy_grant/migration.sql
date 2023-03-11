-- CreateTable
CREATE TABLE "EnergyGrant" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyGrant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnergyGrant" ADD CONSTRAINT "EnergyGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "EnergyGrantNotify"()
RETURNS trigger
AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      PERFORM pg_notify('EnergyGrantInsert', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'UPDATE') THEN
      PERFORM pg_notify('EnergyGrantUpdate', row_to_json(NEW)::text);
    ELSIF (TG_OP = 'DELETE') THEN
      PERFORM pg_notify('EnergyGrantDelete', row_to_json(OLD)::text);
    END IF;
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "EnergyGrantTrigger"
AFTER INSERT OR UPDATE OR DELETE ON "EnergyGrant"
FOR EACH ROW EXECUTE PROCEDURE "EnergyGrantNotify"();
