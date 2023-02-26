<script setup lang="ts">
import { trpc } from "@/services/api";
import { type Unsubscribable } from "@trpc/server/observable";
import { connect, account } from "@/services/eth";
import { addRemoveClassAfterTimeout, displayAddress } from "@/utils";
import { onMounted, onUnmounted, ref, watch } from "vue";
import Currency from "./utility/Currency.vue";
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
header.flex.h-20.w-full.place-content-center.border-b.p-4
  .grid.w-full.max-w-7xl.grid-cols-3
    ul._left.flex.items-center.gap-6
      li
        RouterLink.block.text-2xl.font-extrabold.uppercase.tracking-widest.transition-transform(
          to="/"
        ) δραμα
      li
        RouterLink.pressable.block.uppercase.transition-transform(
          to="/stories"
        ) stories
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="account")
        li
          RouterLink.pressable.flex.items-center.font-medium.transition-transform(
            ref="energyRef"
            to="/energy"
            class="gap-0.5"
          )
            span {{ energy }}
            Currency.h-5.w-5
        li.flex.items-center.gap-3
          span.select-none.font-medium.text-base-300.transition-colors.hover_text-base-800 {{ displayAddress(account) }}
          Jdenticon.h-10.w-10.rounded-full.bg-base-50.p-1(:input="account")
      li(v-else)
        button.btn-web3.btn(@click="connect") Connect
</template>
