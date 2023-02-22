import { z } from "zod";
import { t } from "../index";
import { PrismaClient, UserMessage, CharacterMessage } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { upsertUser } from "../context";
import session from "./chat/session";
import EventEmitter from "events";

export type MessageUpdate = {
  messageId: number;
  token?: string;
  textComplete?: boolean;
  finalized?: boolean;
};

export function onUserMessageChannelName(userId: number, characterId: number) {
  return `chat:${userId}:${characterId}:userMessage`;
}

export function onCharacterMessageChannelName(
  userId: number,
  characterId: number
) {
  return `chat:${userId}:${characterId}:characterMessage`;
}

export function onCharacterMessageUpdateChannelName(
  userId: number,
  characterId: number
) {
  return `chat:${userId}:${characterId}:characterMessageToken`;
}

export const ee = new EventEmitter();
const prisma = new PrismaClient();

export default t.router({
  session,

  getRecentUserMessages: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.findUnique({
        where: {
          userId_characterId: {
            userId: inputAuth.id,
            characterId: input.chat.characterId,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!chat || chat.userId !== inputAuth.id) {
        throw new Error("Chat not found");
      }

      return prisma.userMessage.findMany({
        select: {
          id: true,
          userId: true,
          text: true,
          createdAt: true,
        },
        where: {
          chatId: chat.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  getRecentCharacterMessages: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({ characterId: z.number().positive() }),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.findUnique({
        where: {
          userId_characterId: {
            userId: inputAuth.id,
            characterId: input.chat.characterId,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!chat || chat.userId !== inputAuth.id) {
        throw new Error("Chat not found");
      }

      return prisma.characterMessage.findMany({
        select: {
          id: true,
          characterId: true,
          text: true,
          createdAt: true,
          finalized: true,
        },
        where: {
          chatId: chat.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  onUserMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onUserMessageChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<UserMessage>((emit) => {
        const onAdd = (data: UserMessage) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),

  onCharacterMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onCharacterMessageChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<CharacterMessage>((emit) => {
        const onAdd = (data: CharacterMessage) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),

  onCharacterMessageUpdate: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({ characterId: z.number().positive() }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onCharacterMessageUpdateChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<MessageUpdate>((emit) => {
        const onAdd = (data: MessageUpdate) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),
});
