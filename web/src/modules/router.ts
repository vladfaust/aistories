import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/Messenger.vue"),
    },
    {
      path: "/energy",
      component: () => import("@/components/pages/Energy.vue"),
    },
  ],
});

export { router };
