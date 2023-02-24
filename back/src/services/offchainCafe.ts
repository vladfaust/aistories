import { createClient, defaultExchanges } from "@urql/core";
import { yogaExchange } from "@graphql-yoga/urql-exchange";
import config from "@/config";

export const client = createClient({
  url: config.offchainCafeEndpoint.toString(),
  exchanges: [...defaultExchanges, yogaExchange()],
});
