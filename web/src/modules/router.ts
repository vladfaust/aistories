import Story from "@/models/Story";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/pages/Stories/Index.vue"),
    },
    {
      path: "/new",
      component: () => import("@/components/pages/Stories/Create.vue"),
    },
    {
      path: "/:id",
      component: () => import("@/components/pages/Stories/Show.vue"),
      props: (route) => ({
        story: Story.findOrCreate(parseInt(route.params.id as string)),
      }),
    },
    {
      path: "/energy",
      component: () => import("@/components/pages/Energy.vue"),
    },
    {
      path: "/user/:address",
      component: () => import("@/components/pages/Profile.vue"),
      props: true,
    },
  ],
});

export { router };
