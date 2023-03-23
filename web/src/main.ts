import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import { router } from "./modules/router";
import Notifications from "@kyvg/vue3-notification";
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";
import config from "./config";

const app = createApp(App);

if (config.sentry) {
  Sentry.init({
    app,
    dsn: config.sentry.dsn,
    debug:
      config.sentry.debug !== undefined
        ? config.sentry.debug
        : import.meta.env.DEV,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracePropagationTargets: [
          config.restApiUrl.toString(),
          config.trpcHttpUrl.toString(),
          config.trpcWsUrl.toString(),
          /^\//,
        ],
      }),
    ],
  });
}

app.use(router);
app.use(Notifications);

app.mount("#app");
