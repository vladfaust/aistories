<script lang="ts">
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
</script>

<script setup lang="ts">
import { Character } from "@/models/Character";
import { account, provider } from "@/services/eth";
import {
  type Ref,
  ref,
  type ShallowRef,
  watchEffect,
  computed,
  markRaw,
  nextTick,
} from "vue";
import * as web3Auth from "@/services/web3Auth";
import { trpc } from "@/services/api";
import { useScroll } from "@vueuse/core";
import { format } from "date-fns";
import Spinner from "@/components/Spinner.vue";
import Jdenticon from "@/components/Jdenticon.vue";

function maybeScroll(force: boolean = false) {
  if (force || mainScroll.arrivedState.bottom) {
    mainScroll.y.value = main.value?.scrollHeight || 0;
  }
}

const { character } = defineProps<{
  character: Character;
}>();

const main = ref<HTMLElement | null>(null);
const mainScroll = useScroll(main);

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

// FIXME: Unsubscribe on unmount.
watchEffect(async () => {
  if (character && provider.value) {
    const authToken = await web3Auth.ensure();

    trpc.chat.getRecentUserMessages
      .query({
        authToken,
        chat: { characterId: character.id },
      })
      .then((data) => {
        userMessages.value.push(
          ...data.map((d) => markRaw(new UserMessage(d)))
        );

        nextTick(() => {
          maybeScroll(true);
        });
      });

    trpc.chat.getRecentCharacterMessages
      .query({
        authToken,
        chat: { characterId: character.id },
      })
      .then((data) => {
        characterMessages.value.push(
          ...data.map((d) => markRaw(new CharacterMessage(d, true)))
        );

        nextTick(() => {
          maybeScroll(true);
        });
      });

    trpc.chat.onUserMessage.subscribe(
      {
        authToken,
        chat: { characterId: character.id },
      },
      {
        onData: (data) => {
          userMessages.value.push(markRaw(new UserMessage(data)));
          nextTick(maybeScroll);
        },
      }
    );

    trpc.chat.onCharacterMessage.subscribe(
      {
        authToken,
        chat: { characterId: character.id },
      },
      {
        onData: (data) => {
          characterMessages.value.push(
            markRaw(new CharacterMessage(data, false))
          );

          nextTick(maybeScroll);
        },
      }
    );

    trpc.chat.onCharacterMessageUpdate.subscribe(
      {
        authToken,
        chat: { characterId: character.id },
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
  } else {
    userMessages.value = [];
    characterMessages.value = [];
  }
});
</script>

<template lang="pug">
.flex.h-full.w-full.flex-col.gap-3.overflow-y-auto.p-4(ref="main")
  template(v-for="message of allMessages")
    .flex.gap-2(v-if="message instanceof CharacterMessage && true")
      img.h-10.w-10.rounded-full(:src="character.imagePreviewUrl.toString()")
      p.rounded-lg.rounded-tl-none.bg-base-50.px-3.py-2.leading-snug
        span(v-if="message.text.value.length > 0")
          | {{ message.text.value }}
        span.select-none(v-else)
          Spinner.inline-block.h-4.w-4(kind="dots-fade")
        span.select-none.text-xs.italic.text-gray-400(
          v-if="message.textComplete.value"
        ) &nbsp;{{ format(message.createdAt, "HH:mm") }}
        span.select-none.text-orange-500(
          v-if="latestCharacterMessageId === message.messageId && message.textComplete.value && !message.finalized.value"
          title="Due to an unrecoverable error, this message is not a part of the chat history."
        ) &nbsp;⚠️

    .flex.flex-row-reverse.gap-2(v-else)
      Jdenticon.h-10.w-10.rounded-full.bg-base-50.p-1(
        v-if="account"
        :input="account"
      )
      p.rounded-lg.rounded-tr-none.bg-base-100.px-3.py-2.leading-snug
        | {{ message.text }}
        span.select-none.text-xs.italic.text-gray-400 &nbsp;{{ format(message.createdAt, "HH:mm") }}
</template>
