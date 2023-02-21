<script setup lang="ts">
import {
  computed,
  type Ref,
  ref,
  type ShallowRef,
  markRaw,
  nextTick,
  watchEffect,
} from "vue";
import { trpc } from "@/services/api";
import { useScroll } from "@vueuse/core";
import * as web3Auth from "@/services/web3Auth";
import Input from "./Chat/Input.vue";
import { type Character } from "@/models/Character";
import { Deferred } from "@/utils/deferred";
import { provider } from "@/services/eth";

class UserMessage {
  readonly messageId: number;
  readonly userId: number;
  readonly text: string;
  readonly createdAt: Date;

  constructor(data: {
    id: number;
    userId: number;
    text: string;
    createdAt: string;
  }) {
    this.messageId = data.id;
    this.userId = data.userId;
    this.text = data.text;
    this.createdAt = new Date(data.createdAt);
  }
}

class CharacterMessage {
  readonly messageId: number;
  readonly characterId: number;
  readonly text: Ref<string>;
  readonly textComplete: Ref<boolean>;
  readonly finalized: Ref<boolean>;
  readonly createdAt: Date;

  constructor(
    data: {
      id: number;
      characterId: number;
      text: string | null;
      finalized: boolean;
      createdAt: string;
    },
    textDone: boolean
  ) {
    this.messageId = data.id;
    this.characterId = data.characterId;
    this.text = ref(data.text || "");
    this.textComplete = ref(textDone);
    this.finalized = ref(data.finalized);
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

const userMessages: ShallowRef<UserMessage[]> = ref([]);
const characterMessages: ShallowRef<CharacterMessage[]> = ref([]);

const allMessages = computed(() => {
  return (userMessages.value as (UserMessage | CharacterMessage)[])
    .concat(characterMessages.value)
    .sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
});

const latestCharacterMessageId = computed(() => {
  const latest = characterMessages.value[0];
  return latest?.messageId;
});

watchEffect(async () => {
  if (character.ref.value && provider.value) {
    const authToken = await web3Auth.ensure();

    trpc.chat.getRecentUserMessages
      .query({
        authToken,
        chat: { characterId: character.ref.value.id },
      })
      .then((data) => {
        userMessages.value.push(
          ...data.map((d) => markRaw(new UserMessage(d)))
        );

        nextTick(() => {
          maybeScrollChatbox(true);
        });
      });

    trpc.chat.getRecentCharacterMessages
      .query({
        authToken,
        chat: { characterId: character.ref.value.id },
      })
      .then((data) => {
        characterMessages.value.push(
          ...data.map((d) => markRaw(new CharacterMessage(d, true)))
        );

        nextTick(() => {
          maybeScrollChatbox(true);
        });
      });

    trpc.chat.onCharacterMessageUpdate.subscribe(
      {
        authToken,
        chat: { characterId: character.ref.value.id },
      },
      {
        onData: async (data) => {
          const message = characterMessages.value.find(
            (m) => m.messageId === data.messageId
          );

          if (!message) {
            console.error("Message not found: ", data.messageId);
            return;
          }

          if (data.token !== undefined) {
            if (data.token) {
              message.text.value += data.token;
            }
          } else if (data.textComplete) {
            message.textComplete.value = true;
          } else if (data.finalized) {
            message.finalized.value = true;
          } else {
            console.error("Unknown message update: ", data);
          }
        },
      }
    );

    trpc.chat.onUserMessage.subscribe(
      {
        authToken,
        chat: { characterId: character.ref.value.id },
      },
      {
        onData: (data) => {
          userMessages.value.push(markRaw(new UserMessage(data)));
          nextTick(maybeScrollChatbox);
        },
      }
    );

    trpc.chat.onCharacterMessage.subscribe(
      {
        authToken,
        chat: { characterId: character.ref.value.id },
      },
      {
        onData: (data) => {
          characterMessages.value.push(
            markRaw(new CharacterMessage(data, false))
          );

          nextTick(maybeScrollChatbox);
        },
      }
    );
  } else {
    userMessages.value = [];
    characterMessages.value = [];
  }
});

const sessionId: Ref<number | undefined> = ref();

async function initializeSession() {
  if (!character.ref.value) throw new Error("No character");

  const response = await trpc.chat.initialize.mutate({
    authToken: await web3Auth.ensure(),
    characterId: character.ref.value.id,
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
      v-if="allMessages.length > 0"
      ref="chatbox"
    )
      template(v-for="message of allMessages")
        div(v-if="message instanceof CharacterMessage && true")
          p
            | 🤖
            span(v-if="message.text.value.length > 0") {{ message.text.value }}
            span(v-else) &nbsp;...
            span(
              v-if="latestCharacterMessageId === message.messageId && message.textComplete.value && !message.finalized.value"
              title="Due to an unrecoverable error, this message is not a part of the chat history."
            ) ⚠️
        p(v-else) 👤 {{ message.text }}

    .flex.h-24.place-content-center.place-items-center.rounded-lg.bg-gray-50.p-4
      template(v-if="sessionId")
        Input(:session-id="sessionId")
      template(v-else)
        button.btn.btn-primary.btn-sm.grow-0(@click="initializeSession") Load persona

  template(v-else-if="character.ref.value === undefined")
    p.text-center Loading...
  template(v-else)
    p.text-center.text-lg Character not found
</template>
