import { z } from "zod";
import { t } from "../../index";
import * as pg from "@/services/pg";
import { upsertUser } from "@/trpc/context";
import { observable } from "@trpc/server/observable";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Subscribe to new messages in a story.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      storyId: z.number().positive(),
    })
  )
  .subscription(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: {
        id: input.storyId,
      },
      select: {
        userId: true,
      },
    });

    if (!story || story.userId !== inputAuth.id) {
      throw new Error("Story not found.");
    }

    return observable<
      | {
          id: number;
          characterId: number;
          content: string;
          createdAt: Date;
        }
      | {
          id: number;
          userId: number;
          content: string;
          createdAt: Date;
        }
    >((emit) => {
      const cancels = [
        pg.listen("CharacterMessageInsert", async (payload: any) => {
          const message = JSON.parse(payload) satisfies {
            id: number;
            storyId: number;
            characterId: number;
            content: string;
            createdAt: string; // Timestamp
          };

          if (message.storyId != input.storyId) return;

          emit.next({
            id: message.id,
            characterId: message.characterId,
            content: message.content,
            createdAt: new Date(Date.parse(message.createdAt)),
          });
        }),

        pg.listen("UserMessageChannel", async (payload: any) => {
          const message = JSON.parse(payload) satisfies {
            id: number;
            storyId: number;
            userId: number;
            type: string;
            content: string;
            createdAt: string; // Timestamp
          };

          if (message.storyId != input.storyId) return;

          emit.next({
            id: message.id,
            userId: message.userId,
            content: message.content,
            createdAt: new Date(Date.parse(message.createdAt)),
          });
        }),
      ];

      return () => {
        Promise.all(cancels).then((cancels) => cancels.forEach((c) => c()));
      };
    });
  });
