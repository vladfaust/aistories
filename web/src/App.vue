<script setup lang="ts">
import { ref } from "vue";
import { trpc } from "@/services/api";

const inputText = ref("");

async function onEnter() {
  console.debug("Enter pressed, inputText: ", inputText.value);
  const request = inputText.value;
  inputText.value = "";
  const response = await trpc.message.query(request);
  console.debug(response);
}
</script>

<template lang="pug">
.m-4
  textarea.h-32.w-full.border.p-4(
    placeholder="Input text"
    @keypress.enter.prevent="onEnter"
    v-model="inputText"
  )
</template>
