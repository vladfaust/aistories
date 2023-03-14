import * as pg from "@/services/pg";
import { TRPCError } from "@trpc/server";
import { XXH64 } from "xxh3-ts";

export async function lock(storyId: string): Promise<() => Promise<void>> {
  const pgClient = await pg.pool.connect();
  const hash = XXH64(Buffer.from(storyId, "utf-8")) % 9223372036854775807n;

  const result = await pgClient.query(
    `SELECT pg_try_advisory_lock($1) AS locked`,
    [hash]
  );

  console.debug(`Locked story ${storyId} (${hash}): ${result.rows[0].locked}`);

  if (!result.rows[0].locked) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Story is busy",
    });
  }

  return async () => {
    await pgClient.query("SELECT pg_advisory_unlock($1)", [hash]);
    pgClient.release();
  };
}
