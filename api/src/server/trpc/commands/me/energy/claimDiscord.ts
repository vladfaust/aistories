import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import * as settings from "@/settings";
import * as discord from "@/services/discord";
import * as redis from "@/services/redis";
import * as energy from "@/logic/energy";
import konsole from "@/services/konsole";
import { TRPCError } from "@trpc/server";

export const REASON = "discordGuildMembership";
export const GRANT_SETTING = "discordGuildMembershipEnergyGrant";

const prisma = new PrismaClient();

/**
 * Claim energy for being a member of the Discord guild.
 * @returns Amount of energy claimed.
 */
export default protectedProcedure
  .output(z.number())
  .mutation(async ({ ctx, input }) => {
    const discordIdentity = await prisma.oAuth2Identity.findUnique({
      where: {
        providerId_userId: {
          providerId: "discord",
          userId: ctx.user.id,
        },
      },
      select: {
        accessToken: true,
        tokenType: true,
      },
    });

    if (!discordIdentity) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "You are not logged in with Discord.",
      });
    }

    const guildMember = await discord.getMeGuildMember(
      discordIdentity.tokenType,
      discordIdentity.accessToken
    );

    if (!guildMember) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "You are not a member of the Discord guild.",
      });
    }

    const amount = parseFloat(await settings.get(GRANT_SETTING));

    await prisma.$transaction(async (prisma) => {
      const existingGrant = await prisma.energyGrant.findFirst({
        where: {
          userId: ctx.user.id,
          reason: REASON,
        },
      });

      if (existingGrant) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "You already have a grant for this reason.",
        });
      }

      await prisma.energyGrant.create({
        data: {
          userId: ctx.user.id,
          reason: REASON,
          amount,
        },
      });

      redis.del(energy.fromGrantsKey(ctx.user.id));
    });

    konsole.log([], `Claimed energy for Discord guild membership`, {
      userId: ctx.user.id,
      amount,
    });

    return amount;
  });
