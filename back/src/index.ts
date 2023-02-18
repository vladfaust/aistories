import config from "./config.js";
import { appRouter } from "./trpc/app-router.js";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
  port: config.server.port,
  host: config.server.host,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: () => ({}),
});

wss.on("connection", (ws) => {
  console.log(`++Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`--Connection (${wss.clients.size})`);
  });
});

console.log(
  `WebSocket Server listening on ws://${config.server.host}:${config.server.port}`
);

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
