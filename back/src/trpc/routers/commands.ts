import t from "@/trpc/index";

import character from "./commands/character";
import settings from "./commands/settings";
import story from "./commands/story";
import user from "./commands/user";

export const commandsRouter = t.router({
  character,
  settings,
  story,
  user,
});

export type CommandsRouter = typeof commandsRouter;
