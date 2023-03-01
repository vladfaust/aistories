<script setup lang="ts">
import Jdenticon from "../utility/Jdenticon.vue";
import { jwt, userId } from "@/store";
import { useRouter } from "vue-router";
import * as api from "@/services/api";

const router = useRouter();

const { id } = defineProps<{ id: number }>();

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function disconnect() {
  jwt.value = null;
  deleteCookie("jwt");
  api.recreateWSClient();
  router.push("/");
}
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.items-center.gap-3.place-self-center
  Jdenticon.h-24.w-24.rounded.border(:input="userId")
  code.break-all.text-center.leading-none {{ userId }}
  button.btn.btn-error(@click="disconnect" v-if="userId === id") Disconnect
</template>
