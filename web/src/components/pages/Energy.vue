<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import Currency from "../utility/Currency.vue";
import Topup from "./Energy/Topup.vue";

const energy = useLocalStorage("energy", 0);
</script>

<template lang="pug">
.flex.w-full.justify-center.py-8.px-4
  .flex.max-w-2xl.flex-col.items-center.gap-4
    h1.text-2xl.font-extrabold.uppercase.leading-none.tracking-wider
      span Energy

    p.text-center.leading-snug
      | Energy is used to send messages.
      br
      | 1
      Currency.mr-1.inline-block.h-5.w-5.align-text-bottom(class="ml-0.5")
      | = 1 basic text message sent.

    p.leading-snug
      | Your energy balance is {{ energy }}
      Currency.inline-block.h-5.w-5.align-text-bottom(class="ml-0.5")
      | .

    .mt-2.grid.gap-2.sm_grid-cols-2.sm_grid-rows-2
      .flex.flex-col.gap-2.rounded-lg.border.p-4
        p.text-center.leading-snug
          | Claim free energy for following @dramaai on Twitter!
        button.btn.text-white(style="background-color: #1da1f2" disabled)
          span.ml-4.inline-block Claim 10
          Currency.mr-1.inline-block.h-5.w-5.align-text-bottom(class="ml-0.5")

      Topup.row-span-2.rounded-lg.border.p-4

      .flex.flex-col.gap-2.rounded-lg.border.p-4
        p.text-center.leading-snug
          | Claim free energy for joining the ΔΡΑΜΑ Discord server!
        button.btn.text-white(style="background-color: #5865f2" disabled)
          span.ml-4.inline-block Claim 10
          Currency.mr-1.inline-block.h-5.w-5.align-text-bottom(class="ml-0.5")
</template>
