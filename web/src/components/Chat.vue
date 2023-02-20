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
import { useScroll } from "@vueuse/core";
import * as web3Auth from "@/services/web3Auth";
import Input from "./Chat/Input.vue";

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

const { characterId } = defineProps<{
  characterId: number;
}>();

const chatbox = ref<HTMLElement | null>(null);
const chatboxScroll = useScroll(chatbox);
function maybeScrollChatbox(force: boolean = false) {
  if (force || chatboxScroll.arrivedState.bottom) {
    console.debug("Scrolling to bottom");
    chatboxScroll.y.value = chatbox.value?.scrollHeight || 0;
  }
}

const messages: ShallowRef<Message[]> = ref([]);

const orderedMessages = computed(() => {
  return messages.value.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
});

onMounted(async () => {
  trpc.chat.getRecentMessages
    .query({
      authToken: await web3Auth.ensure(),
      characterId,
    })
    .then((data) => {
      messages.value.push(...data.map((d) => markRaw(new Message(d))));
      nextTick(() => {
        maybeScrollChatbox(true);
      });
    });

  trpc.chat.onMessageToken.subscribe(
    {
      authToken: await web3Auth.ensure(),
      characterId,
    },
    {
      onData: async (data) => {
        const message = messages.value.find((m) => m.id === data.messageId);

        if (!message) {
          console.error("Message not found: ", data.messageId);
          return;
        }

        message.text.value += data.token;
      },
    }
  );

  trpc.chat.onMessage.subscribe(
    {
      authToken: await web3Auth.ensure(),
      characterId,
    },
    {
      onData: (data) => {
        messages.value.push(markRaw(new Message(data)));
        nextTick(maybeScrollChatbox);
      },
    }
  );
});
</script>

<template lang="pug">
.flex.h-screen.flex-col.gap-2.p-4
  .flex.flex-col.gap-1.overflow-y-auto(ref="chatbox")
    template(v-for="message of orderedMessages")
      template(v-if="message.actorId == characterId")
        p 🤖 {{ message.text.value }}
      template(v-else)
        p 👤 {{ message.text.value }}
  Input(:character-id="characterId")
</template>
