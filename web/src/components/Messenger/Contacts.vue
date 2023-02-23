<script setup lang="ts">
import { type Ref, ref } from "vue";
import { Character } from "@/models/Character";

const { characters } = defineProps<{
  characters: Character[];
}>();

const emit = defineEmits<{
  (event: "select", characterId: number | null): void;
}>();

const selectedId: Ref<number | null> = ref(null);
</script>

<template lang="pug">
.flex.h-full.flex-col.divide-y
  .flex.cursor-pointer.items-center.gap-2.p-3(
    v-for="(char, i) in characters"
    :key="char.id"
    @click.stop="emit('select', char.id); selectedId = char.id"
    :class="{ '!border-b': i === characters.length - 1, 'bg-base-50': selectedId == char.id }"
  )
    img.h-12.w-12.rounded-full.bg-base-50.object-cover(
      :src="char.imagePreviewUrl.toString()"
    )
    .flex.flex-col
      span.font-bold.leading-tight {{ char.name }}
      span.text-sm.leading-tight.text-base-500 {{ char.title }}
</template>
