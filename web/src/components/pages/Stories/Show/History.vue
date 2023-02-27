<script lang="ts">
class Content {
  readonly id: number;
  readonly character: Deferred<Character>;
  readonly content: Ref<string>;
  readonly createdAt: Date;

  constructor(data: {
    id: number;
    charId: number;
    content: string | null;
    createdAt: string;
  }) {
    this.id = data.id;
    this.character = Character.findOrCreate(data.charId) as Deferred<Character>;
    this.content = ref(data.content || "");
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
import Spinner from "@/components/utility/Spinner.vue";
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { type Unsubscribable } from "@trpc/server/observable";
import { Deferred } from "@/utils/deferred";
import Character from "@/models/Character";

const { story } = defineProps<{ story: Story }>();

const main = ref<HTMLElement | null>(null);
const mainScroll = useScroll(main);
const content: ShallowRef<Content[]> = ref([]);
let unsubscribables: Unsubscribable[] = [];

function maybeScroll(force: boolean = false) {
  if (force || mainScroll.arrivedState.bottom) {
    mainScroll.y.value = main.value?.scrollHeight || 0;
  }
}

const watchStopHandle = watchEffect(async () => {
  unsubscribables.forEach((u) => u.unsubscribe());
  unsubscribables = [];

  content.value = [];

  if (account.value) {
    const authToken = await web3Auth.ensure();

    trpc.story.getHistory
      .query({
        authToken,
        storyId: story.id,
      })
      .then((data) => {
        content.value.push(...data.map((d) => markRaw(new Content(d))));

        nextTick(() => {
          maybeScroll(true);
        });
      });

    unsubscribables.push(
      trpc.story.onContent.subscribe(
        {
          authToken,
          storyId: story.id,
        },
        {
          onData: (data) => {
            content.value.push(markRaw(new Content(data)));

            nextTick(maybeScroll);
          },
        }
      )
    );

    unsubscribables.push(
      trpc.story.onContentToken.subscribe(
        {
          authToken,
          storyId: story.id,
        },
        {
          onData: async (data) => {
            const found = content.value.find((c) => c.id === data.contentId);

            if (!found) {
              console.error("Content not found: ", data.contentId);
              return;
            }

            found.content.value += data.token;
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
  p.rounded-lg.bg-base-50.p-4.text-center.text-sm.font-medium.italic.text-base-500(
    v-if="story.fabula"
  ) {{ story.fabula }}
  template(v-for="message of content")
    .flex.gap-2
      img.h-10.w-10.rounded-full.object-cover(
        v-if="message.character.ref.value"
        :src="message.character.ref.value.imagePreviewUrl.toString()"
      )
      p.rounded-lg.rounded-tl-none.bg-base-50.px-3.py-2.leading-snug
        span(v-if="message.content.value.length > 0")
          | {{ message.content.value }}
        span.select-none(v-else)
          Spinner.inline-block.h-4.w-4(kind="dots-fade")
</template>
