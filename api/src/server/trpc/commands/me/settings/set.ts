import { PrismaClient } from "@prisma/client";
import z from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      key: z.enum(["openAiApiKey", "useOpenAiApiKey"]),
      value: z.string().nullable(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    switch (input.key) {
      case "openAiApiKey":
        await prisma.user.update({
          where: { id: ctx.user.id },
          data: { openAiApiKey: input.value },
        });
        break;

      case "useOpenAiApiKey":
        await prisma.user.update({
          where: { id: ctx.user.id },
          data: { useOpenAiApiKey: input.value === "true" },
        });
        break;
    }
  });
