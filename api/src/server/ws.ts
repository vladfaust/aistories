import { subscriptionsRouter } from "#trpc/subscriptions";
import { createWsContext } from "#trpc/context.js";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import konsole from "@/services/konsole";

export async function listen(host: string, port: number) {
  const wss = new WebSocketServer({
    host,
    port,
    path: "/trpc/subscriptions",
  });

  const trpcWsHandler = applyWSSHandler({
    wss,
    router: subscriptionsRouter,
    createContext: createWsContext,
  });

  konsole.log([], `WS server listening on ws://${host}:${port}`);

  process.on("SIGTERM", () => {
    trpcWsHandler.broadcastReconnectNotification();
    wss.close();
  });
}
