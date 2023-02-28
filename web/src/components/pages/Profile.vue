<script setup lang="ts">
import Jdenticon from "../utility/Jdenticon.vue";
import { account, disconnect } from "@/services/eth";

const { address } = defineProps<{
  address: string;
}>();
</script>

<template lang="pug">
.flex.w-full.justify-center
  .flex.w-full.max-w-3xl.justify-center.p-4
    .flex.flex-col.items-center.gap-3
      Jdenticon.h-24.w-24.rounded.border(:input="address")
      code.break-all.text-center.leading-none {{ address }}
      button.btn.btn-error(@click="disconnect" v-if="account === address") Disconnect
</template>
