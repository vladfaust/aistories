<script lang="ts">
class UserMessage {
  readonly messageId: number;
  readonly userId: number;
  readonly content: string;
  readonly createdAt: Date;

  constructor(data: {
    id: number;
    userId: number;
    content: string;
    createdAt: string;
  }) {
    this.messageId = data.id;
    this.userId = data.userId;
    this.content = data.content;
    this.createdAt = new Date(data.createdAt);
  }
}

class CharacterMessage {
  readonly messageId: number;
  readonly characterId: number;
  readonly content: Ref<string>;
  readonly complete: Ref<boolean>;
  readonly createdAt: Date;

  constructor(
    data: {
      id: number;
      characterId: number;
      content: string | null;
      createdAt: string;
    },
    textDone: boolean
  ) {
    this.messageId = data.id;
    this.characterId = data.characterId;
    this.content = ref(data.content || "");
    this.complete = ref(textDone);
    this.createdAt = new Date(data.createdAt);
  }
}
</script>

<script setup lang="ts">
import Story from "@/models/Story";
import { account } from "@/services/eth";
import {
  type Ref,
  ref,
  type ShallowRef,
  watchEffect,
  computed,
  markRaw,
  nextTick,
  onUnmounted,
} from "vue";
import * as web3Auth from "@/services/web3Auth";
import { trpc } from "@/services/api";
import { useScroll } from "@vueuse/core";
import { format } from "date-fns";
import Spinner from "@/components/utility/Spinner.vue";
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { type Unsubscribable } from "@trpc/server/observable";

const { story } = defineProps<{ story: Story }>();

const main = ref<HTMLElement | null>(null);
const mainScroll = useScroll(main);
const messages: ShallowRef<(UserMessage | CharacterMessage)[]> = ref([]);
let unsubscribables: Unsubscribable[] = [];

const latestMessageId = computed(() => {
  const latest = messages.value[0];
  return latest?.messageId;
});

function maybeScroll(force: boolean = false) {
  if (force || mainScroll.arrivedState.bottom) {
    mainScroll.y.value = main.value?.scrollHeight || 0;
  }
}

const watchStopHandle = watchEffect(async () => {
  unsubscribables.forEach((u) => u.unsubscribe());
  unsubscribables = [];

  messages.value = [];

  if (account.value) {
    const authToken = await web3Auth.ensure();

    trpc.story.getHistory
      .query({
        authToken,
        storyId: story.id,
      })
      .then((data) => {
        messages.value.push(
          ...data.map((d) =>
            markRaw(
              "userId" in d ? new UserMessage(d) : new CharacterMessage(d, true)
            )
          )
        );

        nextTick(() => {
          maybeScroll(true);
        });
      });

    unsubscribables.push(
      trpc.story.onMessage.subscribe(
        {
          authToken,
          storyId: story.id,
        },
        {
          onData: (data) => {
            messages.value.push(
              markRaw(
                "userId" in data
                  ? new UserMessage(data)
                  : new CharacterMessage(data, false)
              )
            );

            nextTick(maybeScroll);
          },
        }
      )
    );

    unsubscribables.push(
      trpc.story.onMessageToken.subscribe(
        {
          authToken,
          storyId: story.id,
        },
        {
          onData: async (data) => {
            const message = messages.value.find(
              (m) =>
                m instanceof CharacterMessage && m.messageId === data.messageId
            ) as CharacterMessage | undefined;

            if (!message) {
              console.error("Message not found: ", data.messageId);
              return;
            }

            if (data.token == "\n") {
              message.complete.value = true;
            } else {
              message.content.value += data.token;
            }
          },
        }
      )
    );
  }
});

onUnmounted(() => {
  watchStopHandle();
  unsubscribables.forEach((u) => u.unsubscribe());
});
</script>

<template lang="pug">
.flex.h-full.w-full.flex-col.gap-3.overflow-y-auto.p-4(ref="main")
  template(v-for="message of messages")
    .flex.gap-2(v-if="message instanceof CharacterMessage && true")
      img.h-10.w-10.rounded-full(
        v-if="story.character.ref.value"
        :src="story.character.ref.value.imagePreviewUrl.toString()"
      )
      p.rounded-lg.rounded-tl-none.bg-base-50.px-3.py-2.leading-snug
        span(v-if="message.content.value.length > 0")
          | {{ message.content.value }}
        span.select-none(v-else)
          Spinner.inline-block.h-4.w-4(kind="dots-fade")

    .flex.flex-row-reverse.gap-2(v-else)
      Jdenticon.h-10.w-10.rounded-full.bg-base-50.p-1(
        v-if="account"
        :input="account"
      )
      p.rounded-lg.rounded-tr-none.bg-base-100.px-3.py-2.leading-snug {{ message.content }}
</template>
