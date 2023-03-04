import * as health from "./health";
import * as server from "./server";

health.heartbeat();
server.listen();
