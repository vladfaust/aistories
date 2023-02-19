<script setup lang="ts">
import { onMounted } from "vue";
import HeaderVue from "@/components/Header.vue";
import { autoConnect, account } from "@/services/eth";
import Chat from "./components/Chat.vue";

onMounted(autoConnect);
</script>

<template lang="pug">
HeaderVue
template(v-if="account")
  Chat(:character-id="2")
template(v-else)
  .flex.items-center.justify-center.p-4
    p Connect to a wallet to start chatting
</template>
