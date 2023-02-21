<script setup lang="ts">
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";
import { ref } from "vue";

const { sessionId } = defineProps<{
  sessionId: number;
}>();

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);

async function onInputKeypressEnter() {
  if (!inputText.value || inputText.value.trim().length === 0) {
    return;
  }

  const text = inputText.value.trim();
  inputText.value = "";

  await trpc.chat.sendMessage.mutate({
    authToken: await web3Auth.ensure(),
    sessionId: sessionId,
    text,
  });
}

async function addNewline() {
  inputText.value += "\n";
}
</script>

<template lang="pug">
textarea.h-full.w-full.rounded.border.px-4.py-2.leading-tight(
  ref="textarea"
  placeholder="Interaction console"
  @keypress.enter.prevent.exact="onInputKeypressEnter"
  @keypress.shift.enter.exact="addNewline"
  v-model="inputText"
)
</template>
