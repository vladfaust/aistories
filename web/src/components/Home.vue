<script setup lang="ts">
import { onMounted, ref, type ShallowRef } from "vue";
import { autoConnect } from "@/services/eth";
import CharacterVue from "@/components/Character.vue";
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";

onMounted(autoConnect);

const characters: ShallowRef<Character[]> = ref([]);

onMounted(async () => {
  characters.value = await trpc.character.getAll.query();
});
</script>

<template lang="pug">
.flex.w-full.flex-col.gap-3
  CharacterVue.gap-3.rounded-lg.border.p-4(
    v-for="char in characters"
    :key="char.id"
    :char="char"
  )
</template>
