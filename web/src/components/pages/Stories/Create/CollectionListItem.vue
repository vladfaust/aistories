<script setup lang="ts">
import Collection from "@/models/Collection";

const { collection, selected } = defineProps<{
  collection: Collection;
  selected: boolean;
}>();
</script>

<template lang="pug">
img.aspect-square.select-none.rounded.border.bg-base-50.object-contain.transition(
  :src="collection.imageUrl.toString()"
  :class="selected ? 'pressable cursor-pointer opacity-100 shadow-sm' : 'pressable cursor-pointer opacity-40 hover_opacity-100'"
)
</template>
