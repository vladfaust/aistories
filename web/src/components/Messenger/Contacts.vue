<script setup lang="ts">
import { type Ref, ref } from "vue";
import { Character } from "@/models/Character";
import { LockClosedIcon } from "@heroicons/vue/24/outline";

const { characters, displayDetails } = defineProps<{
  characters: Character[];
  displayDetails: boolean;
}>();

const emit = defineEmits<{
  (event: "select", characterId: number | null): void;
}>();

const selectedId: Ref<number | null> = ref(null);
</script>

<template lang="pug">
.flex.flex-col.divide-y.overflow-x-hidden
  .flex.cursor-pointer.items-center.gap-3.p-3(
    v-for="(char, i) in characters"
    :key="char.id"
    @click.stop="emit('select', char.id); selectedId = char.id"
    :class="{ '!border-b': i === characters.length - 1, 'bg-base-50': selectedId == char.id }"
  )
    template(v-if="char.collected.value")
      img.h-12.w-12.rounded-full.bg-base-50.object-cover(
        :src="char.imagePreviewUrl.toString()"
      )
    template(v-else)
      .relative.flex.h-12.w-12.place-content-center.place-items-center.overflow-hidden.rounded-full
        img.absolute.top-0.right-0.bg-base-50.object-cover.blur(
          :src="char.imagePreviewUrl.toString()"
        )
        LockClosedIcon.z-10.h-5.w-5.text-white

    .flex.flex-col(v-if="displayDetails")
      span.font-bold.leading-tight {{ char.name }}
      span.text-sm.leading-tight.text-base-500 {{ char.title }}
</template>
