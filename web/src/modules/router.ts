import { Deferred } from "@/utils/deferred";
import { createRouter, createWebHashHistory } from "vue-router";
import { trpc } from "@/services/api";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/Messenger.vue"),
    },
  ],
});

export { router };
