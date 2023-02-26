<script setup lang="ts">
import Story from "@/models/Story";

const { story } = defineProps<{
  story: Story;
}>();
</script>

<template lang="pug">
.flex.items-center.justify-between.p-4
  .flex.items-center.gap-2
    img.h-10.w-10.rounded-full(
      v-if="story.character.ref.value"
      :src="story.character.ref.value.imagePreviewUrl.toString()"
    )
    span.font-medium {{ story.name || "Story with " + story.character.ref.value?.name }}
</template>
