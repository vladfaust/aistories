import {
  createWSClient,
  createTRPCProxyClient,
  wsLink,
  loggerLink,
} from "@trpc/client";
import type { AppRouter } from "@aiproject/back/trpc";
import config from "../config";

const wsClient = createWSClient({
  url: config.trpcUrl.toString(),
});

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === "development" &&
          typeof window !== "undefined") ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    wsLink({
      client: wsClient,
    }),
  ],
});

export { trpc };
