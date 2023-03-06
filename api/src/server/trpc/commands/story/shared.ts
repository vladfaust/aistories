import * as pg from "@/services/pg";
import { TRPCError } from "@trpc/server";
import { XXH64 } from "xxh3-ts";
import { erc1155Balance } from "@/services/eth";

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

export type Erc1155Token = {
  contractAddress: string; // Hex string.
  tokenId: string; // Hex string.
  uri: string; // URI to the NFT page.
};

export async function maybeVerifyOwnership(
  character: {
    erc1155Token: string | null;
  },
  address?: string
): Promise<void> {
  if (character.erc1155Token) {
    if (!address) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing Web3 token",
      });
    }

    const erc1155Token = JSON.parse(character.erc1155Token) as Erc1155Token;

    const balance = await erc1155Balance(
      erc1155Token.contractAddress,
      erc1155Token.tokenId,
      address
    );

    if (balance.eq(0)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient ERC1155 token balance",
      });
    }
  }
}
