import t from "../index";

import character from "./character";
import chat from "./chat";
import user from "./user";

export const appRouter = t.router({
  character,
  chat,
  user,
});

export type AppRouter = typeof appRouter;
