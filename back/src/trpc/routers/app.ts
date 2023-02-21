import t from "../index";

import character from "./character";
import chat from "./chat";

export const appRouter = t.router({
  character,
  chat,
});

export type AppRouter = typeof appRouter;
