import { t } from "@/trpc/index";

import story from "./subscriptions/story";

export const subscriptionsRouter = t.router({
  story,
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
