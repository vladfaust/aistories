import t from "#trpc";

import character from "./commands/character";
import collections from "./commands/collections";
import settings from "./commands/settings";
import story from "./commands/story";
import user from "./commands/user";

export const commandsRouter = t.router({
  character,
  collections,
  settings,
  story,
  user,
});

export type CommandsRouter = typeof commandsRouter;
