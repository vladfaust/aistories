<script setup lang="ts">
import { connect, account, disconnect } from "@/services/eth";
import Jdenticon from "./Jdenticon.vue";
</script>

<template lang="pug">
header.w-full.bg-gray-800.p-4
  .grid.h-full.grid-cols-3
    .flex.items-center
      .text-2xl.font-bold.text-white
        | Chat
    .flex.items-center.justify-center
      .text-2xl.font-bold.text-white
        | Chat
    ul.flex.items-center.justify-end.gap-2
      template(v-if="account")
        li
          button.btn.bg-gray-500.text-white(@click="disconnect") Disconnect
        li
          Jdenticon.h-8.w-8.rounded-full.bg-white.p-1(:input="account")
      li(v-else)
        button.btn.btn-web3(@click="connect") Connect
</template>
