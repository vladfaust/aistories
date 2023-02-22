<script setup lang="ts">
import { connect, account } from "@/services/eth";
import { displayAddress } from "@/utils";
import Jdenticon from "./Jdenticon.vue";
</script>

<template lang="pug">
header.flex.h-20.w-full.place-content-center.border-b.p-4
  .grid.w-full.max-w-3xl.grid-cols-3
    .flex.items-center
      router-link.pressable.select-none.text-2xl.font-black.uppercase.transition-transform(
        to="/"
      ) NFChar
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="account")
        li.flex.items-center.gap-3
          span.select-none.font-medium.text-base-300.transition-colors.hover_text-base-800 {{ displayAddress(account) }}
          Jdenticon.h-10.w-10.rounded-full.bg-base-50.p-1(:input="account")
      li(v-else)
        button.btn-web3.btn(@click="connect") Connect
</template>
