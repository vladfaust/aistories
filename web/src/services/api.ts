import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@aiproject/back/trpc";
import config from "../config";

// Notice the <AppRouter> generic here.
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: config.trpcUrl.toString(),
    }),
  ],
});

export { trpc };
