import * as health from "./health";
import * as http from "./server/http";
import * as ws from "./server/ws";
import config from "./config";

health.heartbeat();

http.listen(
  config.httpServer.host,
  config.httpServer.port,
  config.httpServer.corsOrigin
);

ws.listen(config.wsServer.host, config.wsServer.port);
