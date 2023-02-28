<script setup lang="ts">
import { trpc } from "@/services/api";
import { type Unsubscribable } from "@trpc/server/observable";
import { connect, account } from "@/services/eth";
import { addRemoveClassAfterTimeout } from "@/utils";
import { onMounted, onUnmounted, ref, watch } from "vue";
import Jdenticon from "./utility/Jdenticon.vue";
import * as web3Auth from "@/services/web3Auth";
import { energy } from "@/store";

let energyUnsubscribable: Unsubscribable | undefined;
let watchStopHandle: () => void;
const energyRef = ref<any | null>(null);

onMounted(() => {
  watchStopHandle = watch(account, async (newAccount) => {
    energyUnsubscribable?.unsubscribe();

    if (newAccount) {
      const authToken = await web3Auth.ensure();

      trpc.user.energy.get.query({ authToken }).then((res) => {
        energy.value = res.energy;
      });

      energyUnsubscribable = trpc.user.energy.onDelta.subscribe(
        { authToken },
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
  });
});

onUnmounted(() => {
  energyUnsubscribable?.unsubscribe();
  watchStopHandle();
});
</script>

<template lang="pug">
header.flex.h-16.w-full.place-content-center.border-y.p-4
  .grid.h-full.w-full.max-w-3xl.grid-cols-3
    ul._left.flex.items-center.gap-6
      li
        RouterLink.pressable.block.text-lg.transition-transform(to="/")
          span ai
          span.font-medium stories
          span .xyz
          span.select-none ™️
          sup.select-none.text-base-400(title="beta") (β)
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="account")
        li
          RouterLink.pressable.inline-block.transition-transform(
            ref="energyRef"
            to="/energy"
          ) ⚡️{{ energy }}
        li
          RouterLink.pressable.flex.items-center.gap-2.transition-transform(
            :to="'/user/' + account"
          )
            Jdenticon.h-8.w-8.rounded.border(:input="account")
      li(v-else)
        button.btn-web3.btn.btn-sm(@click="connect") 🦊 Connect
</template>
