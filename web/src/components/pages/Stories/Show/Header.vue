<script setup lang="ts">
import Story from "@/models/Story";

const { story } = defineProps<{
  story: Story;
}>();
</script>

<template lang="pug">
.box-border.flex.items-center.justify-between.p-3
  .flex.items-center.gap-2
    img.mr-7.box-content.h-8.w-8.rounded.border.bg-base-50.object-cover(
      v-if="story.collection.ref.value?.imageUrl"
      :src="story.collection.ref.value?.imageUrl.toString()"
    )
    template(v-for="character in story.characters.slice().reverse()")
      img.-ml-7.h-8.w-8.rounded-full.border.bg-base-50.object-cover(
        v-if="character.ref.value"
        :src="character.ref.value.imagePreviewUrl.toString()"
      )
    span.font-semibold.leading-tight {{ story.name || story.collection.ref.value?.name + " with " + story.characters.map((c) => c.ref.value?.name).join(", ") }}
</template>
