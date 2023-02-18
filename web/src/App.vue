<script setup lang="ts">
import {
  computed,
  onMounted,
  type Ref,
  ref,
  type ShallowRef,
  markRaw,
  nextTick,
} from "vue";
import { trpc } from "@/services/api";
import { sleep } from "@/utils";
import { useScroll } from "@vueuse/core";

const audioCtx = new AudioContext();

class Message {
  readonly id: number;
  readonly chatId: number;
  readonly actorId: number;
  readonly text: Ref<string>;
  readonly createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.chatId = data.chatId;
    this.actorId = data.actorId;
    this.text = ref(data.text || "");
    this.createdAt = new Date(data.createdAt);
  }
}

const chatbox = ref<HTMLElement | null>(null);
const chatboxScroll = useScroll(chatbox);
function maybeScrollChatbox(force: boolean = false) {
  if (force || chatboxScroll.arrivedState.bottom) {
    console.debug("Scrolling to bottom");
    chatboxScroll.y.value = chatbox.value?.scrollHeight || 0;
  }
}

const inputText = ref("");

async function onEnter() {
  console.debug("Enter pressed, inputText: ", inputText.value);

  const request = inputText.value;
  inputText.value = "";

  const response = await trpc.createUserMessage.mutate(request);

  const message = messages.value.find((m) => m.id === response.id);
  if (!message) throw "Message to complete not found: " + response.id;
}

const messages: ShallowRef<Message[]> = ref([]);

const orderedMessages = computed(() => {
  return messages.value.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
});

onMounted(() => {
  trpc.getChatMessages.query().then((data) => {
    console.debug("getChatMessages: ", data);
    messages.value.push(...data.map((d) => markRaw(new Message(d))));
    nextTick(() => {
      maybeScrollChatbox(true);
    });
  });

  trpc.onChatMessageToken.subscribe(undefined, {
    onData: async (data) => {
      console.debug("onCharMessageSentence/onData: ", data);

      const message = messages.value.find((m) => m.id === data.messageId);

      if (!message) {
        console.error("Message not found: ", data.messageId);
        return;
      }

      message.text.value += data.token;
    },
    onError: (error) => {
      console.error("onCharMessageSentence/onError: ", error);
    },
  });

  trpc.onChatMessage.subscribe(undefined, {
    onData: (data) => {
      console.debug("onChatMessage/onData: ", data);
      messages.value.push(markRaw(new Message(data)));
      nextTick(maybeScrollChatbox);
    },
    onError: (error) => {
      console.error("onChatMessage/onError: ", error);
    },
  });
});
</script>

<template lang="pug">
.flex.h-screen.flex-col.gap-2.p-4
  .flex.flex-col.gap-1.overflow-y-auto(ref="chatbox")
    template(v-for="message of orderedMessages")
      template(v-if="message.actorId == 1")
        p 👤 {{ message.text.value }}
      template(v-else)
        p 🤖 {{ message.text.value }}
  textarea.h-32.w-full.border.p-4(
    placeholder="Input text"
    @keypress.enter.prevent.exact="onEnter"
    v-model="inputText"
  )
</template>
