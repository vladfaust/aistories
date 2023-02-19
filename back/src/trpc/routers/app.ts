import t from "../index";

import chats from "./chats";

export const appRouter = t.router({
  chats,
});

export type AppRouter = typeof appRouter;
