<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import Topup from "./Energy/Topup.vue";

const energy = useLocalStorage("energy", 0);
</script>

<template lang="pug">
.flex.w-full.justify-center
  .flex.w-full.max-w-3xl.justify-center.p-4
    .flex.flex-col.items-center.gap-3
      p.text-center.text-lg.leading-tight
        i Energy
        |
        | is used to generate content.

      p.text-center.leading-tight
        | ⚡️1 ~ one basic text message.
        br
        | Your current balance is ⚡️{{ energy }}.

      Topup.gap-2.rounded.border.p-3(class="mt-0.5")
</template>
