<script setup lang="ts">
import Story from "@/models/Story";
import { Deferred } from "@/utils/deferred";
import { type Unsubscribable } from "@trpc/server/observable";
import { onUnmounted, ref, watch } from "vue";
import Header from "./Show/Header.vue";
import History from "./Show/History.vue";
import Input from "./Show/Input.vue";
import * as api from "@/services/api";

const { story } = defineProps<{ story: Deferred<Story> }>();
const busy = ref(false);

let unsub: Unsubscribable | null = null;

const watchStopHandle = watch(story.ref, (resolved) => {
  if (resolved) {
    unsub = api.trpc.subscriptions.story.onBusy.subscribe(
      { storyId: resolved.id },
      { onData: (data) => (busy.value = data.busy) }
    );
  }
});

onUnmounted(() => {
  unsub?.unsubscribe();
  watchStopHandle();
});
</script>

<template lang="pug">
.flex.max-h-full.w-full.max-w-3xl.flex-col.divide-y.overflow-hidden.rounded.border(
  v-if="story.resolved && story.ref.value"
)
  Header(:story="story.ref.value")
  History.h-full.overflow-y-auto(:story="story.ref.value" :busy="busy")
  Input(:story="story.ref.value" :busy="busy")
p.w-full.max-w-3xl(v-else-if="story.resolved") Story not found
p.w-full.max-w-3xl(v-else) Loading...
</template>
