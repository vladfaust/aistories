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
      path: "/stories",
      component: () => import("@/components/pages/Stories/Index.vue"),
    },
    {
      path: "/stories/new",
      component: () => import("@/components/pages/Stories/Create.vue"),
    },
    {
      path: "/stories/:id",
      component: () => import("@/components/pages/Stories/Show.vue"),
      props: (route) => ({
        story: Story.findOrCreate(parseInt(route.params.id as string)),
      }),
    },
    {
      path: "/energy",
      component: () => import("@/components/pages/Energy.vue"),
    },
  ],
});

export { router };
