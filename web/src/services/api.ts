import { createWSClient, createTRPCProxyClient, wsLink } from "@trpc/client";
import type { AppRouter } from "@aiproject/back/trpc";
import config from "../config";

const wsClient = createWSClient({
  url: config.trpcUrl.toString(),
});

// Notice the <AppRouter> generic here.
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});

export { trpc };
