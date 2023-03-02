import * as health from "./health";
import * as ai from "./ai";
import * as http from "./server/http";
import * as ws from "./server/ws";
import config from "./config";

health.heartbeat();
ai.loop();
http.listen(
  config.httpServer.host,
  config.httpServer.port,
  config.httpServer.corsOrigin
);
ws.listen(config.wsServer.host, config.wsServer.port);
