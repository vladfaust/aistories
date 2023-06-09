<script lang="ts">
class Content {
  readonly id: number;
  readonly character: Deferred<Character>;
  readonly entries: ShallowRef<
    {
      type: "narration" | "utterance";
      text: Ref<string>;
    }[]
  >;
  readonly createdAt: Date;

  constructor(data: {
    id: number;
    charId: number;
    content: string | null;
    createdAt: string;
  }) {
    this.id = data.id;
    this.character = Character.findOrCreate(data.charId) as Deferred<Character>;

    // Iterate through content. Narration is wrapped in [].
    // For example, "Hello! [Waves.] Nice to meet you." would result in
    // [{type: "utterance", content: "Hello!"}, {type: "narration", content: "Waves."}, {type: "utterance", content: "Nice to meet you."}]
    this.entries = shallowRef(
      data.content !== null
        ? data.content.split(/(\[.+?\])/).map((c) => {
            if (c.startsWith("[") && c.endsWith("]")) {
              return {
                type: "narration" as const,
                text: ref(c.slice(1, -1)),
              };
            } else {
              return {
                type: "utterance" as const,
                text: ref(c),
              };
            }
          })
        : []
    );

    this.createdAt = new Date(data.createdAt);
  }
}
</script>

<script setup lang="ts">
import Story from "@/models/Story";
import {
  type Ref,
  ref,
  type ShallowRef,
  watchEffect,
  markRaw,
  nextTick,
  onUnmounted,
  shallowRef,
  triggerRef,
} from "vue";
import * as api from "@/services/api";
import { useScroll } from "@vueuse/core";
import { type Unsubscribable } from "@trpc/server/observable";
import { Deferred } from "@/utils/deferred";
import Character from "@/models/Character";
import Spinner from "@/components/utility/Spinner.vue";
import { userId } from "@/store";

const { story, busy } = defineProps<{
  story: Story;
  busy: boolean;
}>();

const main = ref<HTMLElement | null>(null);
const mainScroll = useScroll(main);
const storyContent: ShallowRef<Content[]> = ref([]);
let unsubscribables: Unsubscribable[] = [];

function maybeScroll(force: boolean = false) {
  if (force || mainScroll.arrivedState.bottom) {
    mainScroll.y.value = main.value?.scrollHeight || 0;
  }
}

const watchStopHandle = watchEffect(async () => {
  unsubscribables.forEach((u) => u.unsubscribe());
  unsubscribables = [];
  storyContent.value = [];

  api.trpc.commands.story.getHistory
    .query({ storyId: story.id })
    .then((data) => {
      storyContent.value.push(...data.map((d) => markRaw(new Content(d))));
      nextTick(() => maybeScroll(true));
    });

  unsubscribables.push(
    api.trpc.subscriptions.story.onContent.subscribe(
      { storyId: story.id },
      {
        onData: (data) => {
          storyContent.value.push(markRaw(new Content(data)));
          nextTick(maybeScroll);
        },
      }
    )
  );
});

onUnmounted(() => {
  watchStopHandle();
  unsubscribables.forEach((u) => u.unsubscribe());
});
</script>

<template lang="pug">
.box-border.flex.w-full.flex-col.gap-2.p-3(ref="main")
  p.bg-base-50.px-3.py-2.text-sm.font-medium.italic.text-base-400(
    v-if="story.fabula"
  ) {{ story.fabula }}
  .flex.items-center.gap-2(v-for="content of storyContent")
    img.box-border.aspect-square.w-9.select-none.rounded.border.object-cover(
      v-if="content.character.ref.value"
      :src="content.character.ref.value.imageUrl.toString()"
    )
    p.h-min.w-full.bg-base-50.px-3.py-2.text-sm.font-medium.leading-tight
      span.font-semibold {{ content.character.ref.value?.name.value }}
      br
      template(v-if="content.entries.value.length === 0")
        Spinner.h-5(:kind="'dots-fade'")
      template(v-else v-for="entry of content.entries.value")
        template(v-if="entry.type === 'narration'")
          span.italic.text-base-400 {{ entry.text.value }}
        template(v-else-if="entry.type === 'utterance'")
          span.text-base-600 {{ entry.text.value }}
      br

  .flex.w-full.justify-center.p-2(v-if="story.user.id === userId")
    Spinner.h-5.w-5.animate-pulse(:kind="'dots-fade'" v-if="busy")
    p.rounded.border.px-2.py-1.text-xs.font-medium.italic.text-base-400(v-else) Waiting for user input

  p.rounded.border.border-error-200.p-2.text-center.text-sm.leading-snug.text-error-500(
    v-if="story.reason.value"
  )
    template(v-if="story.reason.value == 'OpenAI API key is not set'")
      | The story could not progress because the OpenAI API key is not set.
      br
      | Set the key in your
      |
      RouterLink.link(to="/me") profile settings
      | , and try again.

    template(v-else-if="story.reason.value == 'Not enough energy'")
      | Not enough energy to continue the story. Go to
      |
      RouterLink.link(to="/me") profile
      |
      | to get more energy.

    template(v-else) {{ story.reason.value }}
</template>
