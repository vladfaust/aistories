import { commandsRouter } from "#trpc/commands";
import { createExpressContext } from "#trpc/context.js";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import * as trpcWs from "@trpc/server/adapters/ws";
import cors from "cors";
import konsole from "@/services/konsole";
import cookieParser from "cookie-parser";
import config from "@/config";
import { subscriptionsRouter } from "#trpc/subscriptions";
import { createWsContext } from "#trpc/context.js";
import { WebSocketServer } from "ws";
import rest from "./server/rest";

export function listen() {
  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: config.server.corsOrigin,
    })
  );

  app.use(cookieParser());

  app.use("/rest", rest);

  app.use(
    "/trpc/commands",
    trpcExpress.createExpressMiddleware({
      router: commandsRouter,
      createContext: createExpressContext,
    })
  );

  const server = app.listen(config.server.port, config.server.host, () => {
    konsole.log(
      [],
      `Server listening on http://${config.server.host}:${config.server.port}`
    );
  });

  const wss = new WebSocketServer({ server, path: "/trpc/subscriptions" });

  const trpcWsHandler = trpcWs.applyWSSHandler({
    wss,
    router: subscriptionsRouter,
    createContext: createWsContext,
  });

  process.on("SIGTERM", () => {
    trpcWsHandler.broadcastReconnectNotification();
  });
}
