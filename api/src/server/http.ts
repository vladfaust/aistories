import { commandsRouter } from "#trpc/commands";
import { createExpressContext } from "#trpc/context.js";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import konsole from "@/services/konsole";
import cookieParser from "cookie-parser";

export async function listen(host: string, port: number, corsOrigin: string) {
  let app = express();

  app.use(
    cors({
      credentials: true,
      origin: corsOrigin,
    })
  );

  app.use(cookieParser());

  app.use(
    "/trpc/commands",
    trpcExpress.createExpressMiddleware({
      router: commandsRouter,
      createContext: createExpressContext,
    })
  );

  return app.listen(port, host, () => {
    konsole.log([], `HTTP server listening on http://${host}:${port}`);
  });
}
