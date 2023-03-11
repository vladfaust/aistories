<script setup lang="ts">
import * as eth from "@/services/eth";
import Jdenticon from "@/components/utility/Jdenticon.vue";
import Discord from "./Accounts/Discord.vue";
import Placeholder from "@/components/utility/Placeholder.vue";
</script>

<template lang="pug">
.flex.flex-col.divide-y
  .flex.items-center.justify-between.gap-3.p-4
    span.shrink-0.leading-none Discord

    .w-full.bg-base-100(class="h-[1px]")

    Suspense
      template(#default)
        Discord.shrink-0
      template(#fallback)
        Placeholder.h-8.w-24.shrink-0.rounded.bg-base-100

  .flex.items-center.justify-between.gap-3.p-4
    span.shrink-0.leading-none Ethereum wallet

    .w-full.bg-base-100(class="h-[1px]")

    .flex.shrink-0.items-center.gap-2(v-if="eth.account.value")
      code.hidden.text-sm.sm_inline-block {{ eth.account.value.slice(0, 9) }}…
      Jdenticon.w-8.rounded-full.border.p-1(:input="eth.account.value")
      button.btn.btn-error.btn-sm(@click="eth.disconnect") Disconnect
    .flex.shrink-0.items-center.gap-2(v-else)
      span.text-sm.text-base-400 Not connected
      button.btn.btn-web3.btn-sm(@click="eth.connect") Connect wallet
</template>
