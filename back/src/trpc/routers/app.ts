import t from "../index";

import character from "./character";
import story from "./story";
import user from "./user";

export const appRouter = t.router({
  character,
  story,
  user,
});

export type AppRouter = typeof appRouter;
