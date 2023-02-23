<script setup lang="ts">
import { Character } from "@/models/Character";
import { Bars3Icon } from "@heroicons/vue/24/outline";

const { character } = defineProps<{
  character: Character;
}>();

const emit = defineEmits<{
  (event: "toggleContacts"): void;
  (event: "toggleProfile"): void;
}>();
</script>

<template lang="pug">
.flex.items-center.justify-between.p-4
  .flex.items-center.gap-2
    img.h-10.w-10.rounded-full(
      :src="character.imagePreviewUrl.toString()"
      @click="emit('toggleContacts')"
    )
    span.font-bold {{ character.name }}
  Bars3Icon.pressable.h-5.w-5.transition-transform(
    @click="emit('toggleProfile')"
  )
</template>
