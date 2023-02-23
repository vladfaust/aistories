<script setup lang="ts">
import { onMounted, type Ref, ref, type ShallowRef } from "vue";
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";

const emit = defineEmits<{
  (event: "select", characterId: number | null): void;
}>();

const selectedId: Ref<number | null> = ref(null);
const characters: ShallowRef<Character[]> = ref([]);

onMounted(async () => {
  characters.value = await trpc.character.getAll.query();
});
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
      :src="char.imagePreviewUrl"
    )
    .flex.flex-col
      span.font-bold.leading-tight {{ char.name }}
      span.text-sm.leading-tight.text-base-500 {{ char.title }}
</template>
