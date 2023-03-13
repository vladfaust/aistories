import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import { router } from "./modules/router";
import Notifications from "@kyvg/vue3-notification";

const app = createApp(App);

app.use(router);
app.use(Notifications);

app.mount("#app");
