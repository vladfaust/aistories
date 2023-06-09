import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  wsLink,
} from "@trpc/client";
import type { CommandsRouter, SubscriptionsRouter } from "@aistories/api/trpc";
import config from "@/config";

const commands = createTRPCProxyClient<CommandsRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === "development" &&
          typeof window !== "undefined") ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: config.trpcHttpUrl.toString(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

function doCreateWSClient() {
  return createWSClient({
    url: config.trpcWsUrl.toString(),
  });
}

let wsClient = doCreateWSClient();

function recreateWSClient() {
  console.log("Recreating TRPC WS client");
  wsClient = doCreateWSClient();
}

const subscriptions = createTRPCProxyClient<SubscriptionsRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    wsLink({
      client: wsClient,
    }),
  ],
});

export default {
  commands,
  subscriptions,
  recreateWSClient,
};
