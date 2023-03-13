import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as s3 from "@/services/s3";
import config from "@/config";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Create a presigned post for uploading a lore image to S3.
 */
export default protectedProcedure
  .input(
    z.object({
      charId: z.number(),
    })
  )
  .output(
    z.object({
      uploadUrl: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const char = await prisma.character.findUnique({
      where: { id: input.charId },
      select: { creatorId: true },
    });

    if (!char) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Character not found",
      });
    }

    if (char.creatorId !== ctx.user.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not the creator of this character",
      });
    }

    const Key = `/chars/${input.charId}/image`;

    const uploadUrl = await getSignedUrl(
      s3.client,
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key,
      }),
      {
        expiresIn: 60 * 5, // 5 minutes
      }
    );

    return {
      uploadUrl,
    };
  });
