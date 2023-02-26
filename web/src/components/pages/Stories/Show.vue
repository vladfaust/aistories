<script setup lang="ts">
import Story from "@/models/Story";
import { Deferred } from "@/utils/deferred";
import Header from "./Show/Header.vue";
import History from "./Show/History.vue";
import Input from "./Show/Input.vue";

const { story } = defineProps<{
  story: Deferred<Story>;
}>();
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4(style="height: calc(100vh - 5rem)")
  template(v-if="story.resolved")
    .flex.w-full.max-w-3xl.flex-col.divide-y.overflow-hidden.rounded-lg.border(
      v-if="story.ref.value"
    )
      Header(:story="story.ref.value")
      History(:story="story.ref.value")
      Input(:story="story.ref.value")
    p.w-full.max-w-3xl(v-else) Story not found
  p.w-full.max-w-3xl(v-else) Loading...
</template>
