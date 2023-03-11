import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

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
        externalId: true,
        accessToken: true,
      },
    });

    if (discordIdentity) {
      const response = await fetch(`https://discord.com/api/v10/users/@me`, {
        headers: {
          Authorization: `Bearer ${discordIdentity.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Discord user", { cause: response });
      }

      const discord: {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
      } = await response.json();

      return discord;
    } else {
      return null;
    }
  });
