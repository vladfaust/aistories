import { t } from "@/trpc/index";

import story from "./subscriptions/story";
import user from "./subscriptions/user";

export const subscriptionsRouter = t.router({
  story,
  user,
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
