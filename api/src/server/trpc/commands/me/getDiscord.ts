import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import * as discord from "@/services/discord";

const prisma = new PrismaClient();

/**
 * Returns Discord user of the logged in user.
 */
export default protectedProcedure
  .output(
    z
      .object({
        id: z.string(),
        username: z.string(),
        discriminator: z.string(),
        avatar: z.string().nullable(),
      })
      .nullable()
  )
  .query(async ({ ctx }) => {
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

    if (discordIdentity) {
      return await discord.me(
        discordIdentity.tokenType,
        discordIdentity.accessToken
      );
    } else {
      return null;
    }
  });
