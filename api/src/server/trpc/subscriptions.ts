import { t } from "#trpc";

import me from "./subscriptions/me";
import story from "./subscriptions/story";

export const subscriptionsRouter = t.router({
  me,
  story,
});

export type SubscriptionsRouter = typeof subscriptionsRouter;
