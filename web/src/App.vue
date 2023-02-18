<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, type ShallowRef } from "vue";
import { trpc } from "@/services/api";

type HumanMessage = {
  id: number;
  text: string;
  createdAt: string;
};

type BotMessage = {
  id: number;
  text: string;
  createdAt: string;
  humanMessageId: number;
};

const inputText = ref("");

async function onEnter() {
  console.debug("Enter pressed, inputText: ", inputText.value);
  const request = inputText.value;
  inputText.value = "";
  const response = await trpc.createHumanMessage.mutate(request);
  console.debug(response);
}

const messages: ShallowRef<(HumanMessage | BotMessage)[]> = ref([]);

const orderedMessages = computed(() => {
  return messages.value.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
});

onMounted(() => {
  trpc.getHumanMessages.query().then((data) => {
    console.debug("getHumanMessages: ", data);
    messages.value.push(...data);
  });

  trpc.getBotMessages.query().then((data) => {
    console.debug("getBotMessages: ", data);
    messages.value.push(...data);
  });

  trpc.onHumanMessage.subscribe(undefined, {
    onData: (data) => {
      console.debug("onData: ", data);
      messages.value.push(data);
    },
    onError: (error) => {
      console.error("onError: ", error);
    },
  });

  trpc.onBotMessage.subscribe(undefined, {
    onData: (data) => {
      console.debug("onData: ", data);
      messages.value.push(data);
    },
    onError: (error) => {
      console.error("onError: ", error);
    },
  });
});
</script>

<template lang="pug">
.m-4
  .flex.flex-col
    template(v-for="message of orderedMessages")
      template(v-if="'humanMessageId' in message")
        p 🤖 {{ message.text }}
      template(v-else)
        p 👤 {{ message.text }}
  textarea.h-32.w-full.border.p-4(
    placeholder="Input text"
    @keypress.enter.prevent.exact="onEnter"
    v-model="inputText"
  )
</template>
