<script setup lang="ts">
import Story from "@/models/Story";
import { Deferred } from "@/utils/deferred";
import { type Unsubscribable } from "@trpc/server/observable";
import { onUnmounted, ref } from "vue";
import Header from "./Show/Header.vue";
import History from "./Show/History.vue";
import Input from "./Show/Input.vue";
import * as api from "@/services/api";
import { userId } from "@/store";
import nProgress from "nprogress";

const { story } = defineProps<{ story: Deferred<Story> }>();
const busy = ref(false);

await story.promise;
nProgress.done();

let unsub: Unsubscribable | null = null;

if (story.ref.value) {
  unsub = api.trpc.subscriptions.story.onStatus.subscribe(
    { storyId: story.ref.value.id },
    {
      onData: (data) => {
        if (data.busy !== undefined) {
          busy.value = data.busy;
        }

        if (data.reason !== undefined) {
          story.ref.value!.reason.value = data.reason;
        }
      },
    }
  );
}

onUnmounted(() => {
  unsub?.unsubscribe();
});
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.divide-y.overflow-hidden.rounded.border(
  v-if="story.resolved && story.ref.value"
  style="height: calc(100vh - 10rem)"
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
