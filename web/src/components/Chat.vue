<script setup lang="ts">
import {
  computed,
  type Ref,
  ref,
  type ShallowRef,
  markRaw,
  nextTick,
  watch,
} from "vue";
import { trpc } from "@/services/api";
import { useScroll } from "@vueuse/core";
import * as web3Auth from "@/services/web3Auth";
import Input from "./Chat/Input.vue";
import { type Character } from "@/models/Character";
import { Deferred } from "@/utils/deferred";

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

const { character } = defineProps<{
  character: Deferred<Character | null>;
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

watch(
  character.ref,
  async (char) => {
    if (char) {
      const authToken = await web3Auth.ensure();

      trpc.chat.getRecentMessages
        .query({
          authToken,
          characterId: char.actorId,
        })
        .then((data) => {
          messages.value.push(...data.map((d) => markRaw(new Message(d))));
          nextTick(() => {
            maybeScrollChatbox(true);
          });
        });

      trpc.chat.onMessageToken.subscribe(
        {
          authToken,
          characterId: char.actorId,
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
          authToken,
          characterId: char.actorId,
        },
        {
          onData: (data) => {
            messages.value.push(markRaw(new Message(data)));
            nextTick(maybeScrollChatbox);
          },
        }
      );
    }
  },
  {
    immediate: true,
  }
);

const sessionId: Ref<number | undefined> = ref();

async function initializeSession() {
  if (!character.ref.value) throw new Error("No character");

  const response = await trpc.chat.initialize.mutate({
    authToken: await web3Auth.ensure(),
    characterId: character.ref.value.actorId,
  });

  sessionId.value = response.sessionId;
}
</script>

<template lang="pug">
.flex.flex-col.gap-3(style="height: calc(100vh - 4rem - 3rem)")
  template(v-if="character.ref.value")
    .flex.items-center.justify-between.rounded-lg.bg-gray-50.p-4
      .flex.items-center.gap-3
        img.w-12.rounded-full(:src="character.ref.value.imagePreviewUrl")
        span
          span.font-semibold {{ character.ref.value.name }}

    .flex.shrink.flex-col.gap-1.overflow-y-auto.rounded-lg.bg-gray-50.p-4(
      v-if="messages.length > 0"
      ref="chatbox"
    )
      template(v-for="message of orderedMessages")
        p(v-if="message.actorId == character.ref.value.actorId") 🤖 {{ message.text.value }}
        p(v-else) 👤 {{ message.text.value }}

    .flex.h-32.place-content-center.place-items-center.rounded-lg.bg-gray-50.p-4
      template(v-if="sessionId")
        Input(:session-id="sessionId")
      template(v-else)
        button.btn.btn-primary.btn-sm.grow-0(@click="initializeSession") Load persona

  template(v-else-if="character.ref.value === undefined")
    p.text-center Loading...
  template(v-else)
    p.text-center.text-lg Character not found
</template>
