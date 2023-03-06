<script setup lang="ts">
import Story from "@/models/Story";
import { Deferred } from "@/utils/deferred";
import { type Unsubscribable } from "@trpc/server/observable";
import { onMounted, onUnmounted, ref, watch, type WatchStopHandle } from "vue";
import Header from "./Show/Header.vue";
import History from "./Show/History.vue";
import Input from "./Show/Input.vue";
import * as api from "@/services/api";
import { userId } from "@/store";

const { story } = defineProps<{ story: Deferred<Story> }>();
const busy = ref(false);

let unsub: Unsubscribable | null = null;
let watchStopHandle: WatchStopHandle | null = null;

onMounted(() => {
  watchStopHandle = watch(
    story.ref,
    (resolvedStory) => {
      if (resolvedStory) {
        unsub = api.trpc.subscriptions.story.onStatus.subscribe(
          { storyId: resolvedStory.id },
          {
            onData: (data) => {
              if (data.busy !== undefined) {
                busy.value = data.busy;
              }

              if (data.reason !== undefined) {
                resolvedStory.reason.value = data.reason;
              }
            },
          }
        );
      }
    },
    { immediate: true }
  );
});

onUnmounted(() => {
  unsub?.unsubscribe();
  watchStopHandle?.();
});
</script>

<template lang="pug">
.flex.max-h-full.w-full.max-w-3xl.flex-col.divide-y.overflow-hidden.rounded.border(
  v-if="story.resolved && story.ref.value"
)
  Header(:story="story.ref.value")
  History.h-full.overflow-y-auto(:story="story.ref.value" :busy="busy")
  Input(
    v-if="story.ref.value.user.id == userId"
    :story="story.ref.value"
    :busy="busy"
  )
p.w-full.max-w-3xl(v-else-if="story.resolved") Story not found
p.w-full.max-w-3xl(v-else) Loading...
</template>
