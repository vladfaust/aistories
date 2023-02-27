<script setup lang="ts">
import Story from "@/models/Story";

const { story } = defineProps<{
  story: Story;
}>();
</script>

<template lang="pug">
.flex.items-center.justify-between.p-4
  .flex.items-center.gap-2.pl-5
    template(v-for="character in story.characters.slice().reverse()")
      img.-ml-5.h-10.w-10.rounded-full.border.bg-base-50.object-cover(
        v-if="character.ref.value"
        :src="character.ref.value.imagePreviewUrl.toString()"
      )
    span.font-semibold.leading-tight {{ story.name || "Story with " + story.characters.map((c) => c.ref.value?.name).join(", ") }}
</template>
