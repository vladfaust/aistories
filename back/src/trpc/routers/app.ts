import t from "../index";

import chat from "./chat";

export const appRouter = t.router({
  chat,
});

export type AppRouter = typeof appRouter;
