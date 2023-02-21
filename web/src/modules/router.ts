import { Deferred } from "@/utils/deferred";
import { createRouter, createWebHashHistory } from "vue-router";
import { trpc } from "@/services/api";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/Home.vue"),
    },
    {
      path: "/chat/:characterId",
      component: () => import("@/components/Chat.vue"),
      props: (route) => ({
        character: Deferred.create(
          trpc.character.find.query({
            id: parseInt(route.params.characterId as string),
          })
        ),
      }),
    },
  ],
});

export { router };
