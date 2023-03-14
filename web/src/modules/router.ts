import Character from "@/models/Character";
import Lore from "@/models/Lore";
import Story from "@/models/Story";
import { userId } from "@/store";
import { Deferred } from "@/utils/deferred";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/components/pages/Stories/Index.vue"),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/lores",
      component: () => import("@/components/pages/Lore/Index.vue"),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/lores/new",
      component: () => import("@/components/pages/Lore/Edit.vue"),
    },
    {
      path: "/lores/:id/edit",
      component: () => import("@/components/pages/Lore/Edit.vue"),
      props: (route) => ({
        lore: Lore.findOrCreate(parseInt(route.params.id as string)),
      }),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/lores/:id",
      component: () => import("@/components/pages/Lore/Show.vue"),
      props: (route) => ({
        lore: Lore.findOrCreate(parseInt(route.params.id as string)),
      }),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/chars",
      component: () => import("@/components/pages/Character/Index.vue"),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/chars/new",
      component: () => import("@/components/pages/Character/Edit.vue"),
      props: (route) => ({
        lore: Lore.findOrCreate(parseInt(route.query.loreId as string)),
      }),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/chars/:id/edit",
      component: () => import("@/components/pages/Character/Edit.vue"),
      props: (route) => {
        const char = Character.findOrCreate(
          parseInt(route.params.id as string)
        );

        const lore = Deferred.create(
          char.promise.then(
            (c) => c?.lore.promise.then((l) => l || null) || null
          )
        );

        return {
          lore,
          char,
        };
      },
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/chars/:id",
      component: () => import("@/components/pages/Character/Show.vue"),
      props: (route) => ({
        character: Character.findOrCreate(parseInt(route.params.id as string)),
      }),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/story/new",
      component: () => import("@/components/pages/Stories/Create.vue"),
      meta: { doNotTerminateNProgress: true },
    },
    {
      path: "/story/:id",
      component: () => import("@/components/pages/Stories/Show.vue"),
      props: (route) => ({
        story: Story.findOrCreate(route.params.id as string),
      }),
      meta: { doNotTerminateNProgress: true },
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
