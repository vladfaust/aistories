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
.flex.w-full.max-w-3xl.flex-col.divide-y.overflow-hidden.rounded.border(
  v-if="story.resolved && story.ref.value"
)
  Header(:story="story.ref.value")
  History(:story="story.ref.value")
  Input(:story="story.ref.value")
p.w-full.max-w-3xl(v-else-if="story.resolved") Story not found
p.w-full.max-w-3xl(v-else) Loading...
</template>
