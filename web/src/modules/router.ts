import Story from "@/models/Story";
import { userId } from "@/store";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/pages/Stories/Index.vue"),
    },
    {
      path: "/story/new",
      component: () => import("@/components/pages/Stories/Create.vue"),
    },
    {
      path: "/story/:id",
      component: () => import("@/components/pages/Stories/Show.vue"),
      props: (route) => ({
        story: Story.findOrCreate(route.params.id as string),
      }),
    },
    {
      path: "/me",
      component: () => import("@/components/pages/Me.vue"),
      beforeEnter: (to, from, next) => {
        if (userId.value) {
          next();
        } else {
          next("/");
        }
      },
    },
  ],
});

export { router };
