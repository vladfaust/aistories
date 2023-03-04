import { t } from "#trpc";

import story from "./subscriptions/story";

export const subscriptionsRouter = t.router({
  story,
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
