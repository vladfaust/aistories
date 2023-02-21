<script setup lang="ts">
import { connect, account, disconnect } from "@/services/eth";
import Jdenticon from "./Jdenticon.vue";
</script>

<template lang="pug">
header.flex.h-20.w-full.place-content-center.bg-gray-800.p-4
  .grid.w-full.max-w-3xl.grid-cols-3
    .flex.items-center
      router-link.pressable.text-xl.font-semibold.uppercase.text-white.transition-transform(
        to="/"
      )
        | AiProject
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="account")
        li
          button.btn.bg-gray-500.text-white(@click="disconnect") Disconnect
        li
          Jdenticon.h-8.w-8.rounded-full.bg-white.p-1(:input="account")
      li(v-else)
        button.btn.btn-web3(@click="connect") Connect
</template>
