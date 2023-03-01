<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import Spinner2 from "../utility/Spinner2.vue";
import Web3Topup from "./Energy/Web3Topup.vue";

const energy = useLocalStorage("energy", 0);
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.items-center.gap-3.place-self-center
  p.text-center.text-lg.leading-tight
    i Energy
    |
    | is used to generate content.

  p.text-center.leading-tight
    | ⚡️1 ~ one basic text message.
    br
    | Your current balance is ⚡️{{ energy }}.

  Suspense
    Web3Topup.gap-2.rounded.border.p-3(class="mt-0.5")
    template(#fallback)
      .flex.justify-center
        Spinner2.h-5.animate-spin
</template>
