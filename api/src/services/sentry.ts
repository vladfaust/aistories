import config from "@/config";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

if (config.sentry) {
  Sentry.init({
    dsn: config.sentry.dsn,
    debug:
      config.sentry.debug !== undefined ? config.sentry.debug : config.prod,
    environment: config.sentry.environment,
  });
}

export default Sentry;
