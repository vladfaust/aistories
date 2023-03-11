import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ethers } from "ethers";
import { getReceiverEvents } from "@/services/eth";
import Web3Token from "web3-token";
import * as settings from "@/settings";
import konsole from "@/services/konsole";
import { toBuffer } from "@/utils";
import * as redis from "@/services/redis";
import * as energy from "@/logic/energy";

const prisma = new PrismaClient();

/**
 * Claim Web3 energy purchase events.
 * @returns The number of claimed events.
 */
export default protectedProcedure
  .input(
    z.object({
      web3Token: z.string(),
    })
  )
  .output(
    z.object({
      claimedEventsCount: z.number(),
    })
  )
  .query(async ({ ctx, input }) => {
    const [exchangeRate, energyWeb3ExchangeMinValue] = await Promise.all([
      parseFloat(await settings.get("energyWeb3ExchangeRate")),
      ethers.utils.parseEther(await settings.get("energyWeb3ExchangeMinValue")),
    ]);

    const address = Web3Token.verify(input.web3Token).address;

    const latestClaimedBlock = (
      await prisma.web3EnergyPurchase.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { blockNumber: "desc" },
        select: { blockNumber: true },
      })
    )?.blockNumber;

    let data = [];

    for await (const event of getReceiverEvents(
      address,
      latestClaimedBlock ? latestClaimedBlock - 1 : undefined
    )) {
      if (event.value.lt(energyWeb3ExchangeMinValue)) {
        konsole.log(
          ["me", "energy", "claim"],
          "Skipping event due to insufficient value",
          {
            txHash: event.txHash,
            logIndex: event.logIndex,
            value: event.value._hex,
          }
        );

        continue;
      }

      data.push({
        userId: ctx.user.id,
        blockNumber: event.blockNumber,
        logIndex: event.logIndex,
        txHash: event.txHash,
        value: toBuffer(event.value),
        amount: event.value
          .mul(exchangeRate)
          .div(ethers.utils.parseEther("1"))
          .toNumber(),
      });
    }

    if (data.length > 0) {
      redis.del(energy.fromWeb3PurchasesKey(ctx.user.id));

      return {
        claimedEventsCount: (
          await prisma.web3EnergyPurchase.createMany({
            data,
            skipDuplicates: true,
          })
        ).count,
      };
    }

    return {
      claimedEventsCount: 0,
    };
  });
