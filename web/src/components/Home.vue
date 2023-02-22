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
.flex.place-content-center.py-4
  .flex.w-full.max-w-3xl.flex-col.gap-3
    CharacterVue(v-for="char in characters" :key="char.id" :char="char")
</template>
