import { PrismaClient } from "@prisma/client";
import z from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(z.enum(["openAiApiKey"]))
  .output(z.string().nullable())
  .query(async ({ ctx, input }) => {
    return (
      await prisma.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
        select: { openAiApiKey: true },
      })
    ).openAiApiKey;
  });
