<script setup lang="ts">
import Character from "@/models/Character";
import * as api from "@/services/api";
import { userId } from "@/store";
import { computed, onMounted, ref, type Ref, type ShallowRef } from "vue";
import { useRouter } from "vue-router";
import CharacterCard from "./Create/CharacterCard.vue";
import CharacterListItem from "./Create/CharacterListItem.vue";

const router = useRouter();

const allCharacters: ShallowRef<Character[]> = ref([]);
const selectedProtagonist: ShallowRef<Character | null> = ref(null);
const selectedCharactes: ShallowRef<Set<Character>> = ref(new Set());
const setup: Ref<string | undefined> = ref();
const fabula: Ref<string | undefined> = ref();

const mayCreate = computed(() => {
  return (
    !createInProgress.value &&
    selectedProtagonist.value &&
    selectedCharactes.value.size > 0
  );
});
const createInProgress = ref(false);

onMounted(() => {
  api.commands.character.index.query().then(async (ids) => {
    allCharacters.value = (await Promise.all(
      ids.map((id) => Character.findOrCreate(id).promise)
    )) as Character[];
  });
});

async function create() {
  if (!mayCreate.value) return;

  if (!userId.value) {
    alert("You must be logged in to create a story.");
    return;
  }

  createInProgress.value = true;

  try {
    const storyId = await api.commands.story.create.mutate({
      nonUserCharacterIds: [...selectedCharactes.value.values()].map(
        (c) => c.id
      ),
      userCharacterId: selectedProtagonist.value!.id,
      setup: setup.value,
      fabula: fabula.value,
    });

    router.push(`/${storyId}`);
  } finally {
    createInProgress.value = false;
  }
}
</script>

<template lang="pug">
.flex.h-full.w-full.max-w-3xl.flex-col.gap-3.overflow-y-auto
  h2.text-lg.leading-none 1. Choose protagonist
  .flex.flex-col.gap-3
    .grid.grid-cols-8.gap-3
      CharacterListItem(
        v-for="character in allCharacters"
        :key="character.id"
        :character="character"
        :selected="character === selectedProtagonist"
        @click="selectedProtagonist = character; selectedCharactes.delete(character)"
      )

    CharacterCard(
      v-if="selectedProtagonist"
      :key="selectedProtagonist.id"
      :character="selectedProtagonist"
    )

  h2.text-lg.leading-none 2. Choose characters
  .flex.flex-col.gap-3
    .grid.grid-cols-8.gap-3
      CharacterListItem(
        v-for="character in allCharacters"
        :key="character.id"
        :character="character"
        :selected="selectedCharactes.has(character)"
        :disabled="selectedProtagonist === character"
        @click="selectedProtagonist === character ? null : selectedCharactes.has(character) ? selectedCharactes.delete(character) : selectedCharactes.add(character)"
      )

    CharacterCard(
      v-for="character in selectedCharactes"
      :key="character.id"
      :character="character"
    )

  h2.text-lg.leading-none 3. Write fabula (optional)
  textarea.w-full.rounded.border.p-3.leading-tight(
    class="min-h-[4rem]"
    v-model="fabula"
    placeholder="Write your story here..."
  )

  button.btn.btn-primary.w-full(@click="create" :disabled="!mayCreate") Embark 🚀
</template>
