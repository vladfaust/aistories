<script setup lang="ts">
import Web3Purchase from "./Energy/Web3Purchase.vue";
import OpenAiApi from "./Energy/OpenAiApi.vue";
import EnergyIcon from "@/components/utility/EnergyIcon.vue";
import Placeholder from "@/components/utility/Placeholder.vue";
import { energy } from "@/store";
import Discord from "./Energy/Discord.vue";
</script>

<template lang="pug">
.flex.flex-col.gap-3.p-4
  .flex.items-center.justify-between.gap-3
    span Balance
    .w-full.bg-base-100(class="h-[1px]")

    .flex.items-center(v-if="energy !== undefined")
      EnergyIcon.h-5
      span {{ energy }}
    Placeholder.h-5.w-10.rounded.bg-base-100(v-else)

  .grid.grid-cols-1.gap-3.sm_grid-cols-3
    Suspense
      template(#default)
        Discord.gap-3.rounded.border.p-4
      template(#fallback)
        Placeholder.h-full.w-full.rounded.bg-base-100

    Suspense
      template(#default)
        Web3Purchase.gap-3.rounded.border.p-4
      template(#fallback)
        Placeholder.h-full.w-full.rounded.bg-base-100

    .flex.flex-col.gap-3.rounded.border.p-4.opacity-40
      p.place-self-center.rounded.bg-base-50.p-3.text-center.leading-tight
        | Purchase energy credits with credit card
      button.btn-raised.btn.btn-primary.w-full(disabled) Soon™️

  Suspense
    template(#default)
      OpenAiApi.gap-1.rounded.border.p-3
    template(#fallback)
      Placeholder.h-32.w-full.rounded.bg-base-100
</template>
