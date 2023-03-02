<script setup lang="ts">
/// <reference types="vite-svg-loader" />
import * as api from "@/services/api";
import { type Unsubscribable } from "@trpc/server/observable";
import { addRemoveClassAfterTimeout } from "@/utils";
import { onMounted, onUnmounted, ref, watch } from "vue";
import Jdenticon from "./utility/Jdenticon.vue";
import { energy } from "@/store";
import { userId } from "@/store";
import * as auth from "@/services/auth";
import DiscordLogo from "@/assets/discord.svg?component";

let energyUnsubscribable: Unsubscribable | undefined;
let watchStopHandle: () => void;
const energyRef = ref<any | null>(null);

onMounted(() => {
  watchStopHandle = watch(
    userId,
    async (newUserId) => {
      console.log("userId changed", newUserId);
      energyUnsubscribable?.unsubscribe();

      if (newUserId) {
        api.commands.user.getEnergy.query().then((res) => {
          energy.value = res.energy;
        });

        energyUnsubscribable = api.subscriptions.user.onEnergyDelta.subscribe(
          undefined,
          {
            onData: (data) => {
              energy.value! += data;
              addRemoveClassAfterTimeout(
                energyRef.value!.$el,
                ["animate__animated", "animate__rubberBand", "animate__faster"],
                1000
              );
            },
          }
        );
      }
    },
    {
      immediate: true,
    }
  );
});

onUnmounted(() => {
  energyUnsubscribable?.unsubscribe();
  watchStopHandle();
});
</script>

<template lang="pug">
header.flex.h-16.w-full.place-content-center.border-y.px-4
  .grid.h-full.w-full.max-w-3xl.grid-cols-3
    ul._left.flex.items-center.gap-6
      li
        RouterLink.pressable.block.text-lg.transition-transform(to="/")
          | aistories.xyz
          span.select-none ™️
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="userId")
        li
          RouterLink.pressable.inline-block.transition-transform(
            ref="energyRef"
            to="/energy"
          ) ⚡️{{ energy }}
        li
          RouterLink.pressable.flex.items-center.gap-2.transition-transform(
            :to="'/user/' + userId"
          )
            Jdenticon.h-8.w-8.rounded.border(:input="userId")
      li(v-else)
        a.btn.btn-sm.gap-2.text-white(
          class="bg-[#5865F2]"
          :href="auth.url(auth.Provider.Discord)"
        )
          | Log in
          DiscordLogo.h-5.fill-white
</template>
