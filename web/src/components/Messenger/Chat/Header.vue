<script setup lang="ts">
import { type Character } from "@/models/Character";
import { Bars3Icon } from "@heroicons/vue/24/outline";

const { character } = defineProps<{
  character: Character;
}>();
</script>

<template lang="pug">
.flex.items-center.justify-between.p-4
  .flex.items-center.gap-2
    img.h-10.w-10.rounded-full(:src="character.imagePreviewUrl")
    span.font-bold {{ character.name }}
  Bars3Icon.h-5.w-5
</template>
