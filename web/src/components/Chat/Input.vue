<script setup lang="ts">
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";
import { type Ref, ref } from "vue";

const { characterId } = defineProps<{
  characterId: number;
}>();

const sessionId: Ref<number | undefined> = ref();
const inputText = ref("");

async function initialize() {
  const response = await trpc.chat.initialize.mutate({
    authToken: await web3Auth.ensure(),
    characterId,
  });
  console.debug("initialize: ", response);
  sessionId.value = response.sessionId;
}

async function onInputKeypressEnter() {
  if (!sessionId.value) throw new Error("No session id");

  console.debug("Enter pressed, inputText: ", inputText.value);

  const text = inputText.value;
  inputText.value = "";

  await trpc.chat.sendMessage.mutate({
    authToken: await web3Auth.ensure(),
    sessionId: sessionId.value!,
    text,
  });
}
</script>

<template lang="pug">
template(v-if="sessionId")
  textarea.w-full.rounded.border.p-2(
    placeholder="Input text"
    @keypress.enter.prevent.exact="onInputKeypressEnter"
    v-model="inputText"
  )
template(v-else)
  button.btn.btn-primary(@click="initialize") Initialize chat
</template>
