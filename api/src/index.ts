import * as health from "./health";
import * as server from "./server";
import Sentry from "./services/sentry";

process.on("uncaughtException", function (e) {
  Sentry.captureException(e);
  process.exit(1);
});

health.heartbeat();
server.listen();
