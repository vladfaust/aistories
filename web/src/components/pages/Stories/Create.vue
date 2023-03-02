<script setup lang="ts">
import Character from "@/models/Character";
import Collection from "@/models/Collection";
import * as api from "@/services/api";
import { userId } from "@/store";
import { computed, onMounted, ref, type Ref, type ShallowRef } from "vue";
import { useRouter } from "vue-router";
import CollectionListItem from "./Create/CollectionListItem.vue";
import CollectionCard from "./Create/CollectionCard.vue";
import CharacterCard from "./Create/CharacterCard.vue";
import CharacterListItem from "./Create/CharacterListItem.vue";

const router = useRouter();

const collections: ShallowRef<Collection[]> = ref([]);
const chosenCollection: Ref<Collection | undefined> = ref();

const characters: ShallowRef<Character[]> = ref([]);
const chosenProtagonist: ShallowRef<Character | null> = ref(null);
const selectedCharactes: ShallowRef<Set<Character>> = ref(new Set());
const fabula: Ref<string | undefined> = ref();

const mayCreate = computed(() => {
  return (
    !createInProgress.value &&
    chosenCollection.value &&
    chosenProtagonist.value &&
    selectedCharactes.value.size > 0
  );
});
const createInProgress = ref(false);

onMounted(() => {
  api.commands.collections.index.query().then(async (ids) => {
    collections.value = (await Promise.all(
      ids.map((id) => Collection.findOrCreate(id).promise)
    )) as Collection[];
  });

  api.commands.character.index.query().then(async (ids) => {
    characters.value = (await Promise.all(
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
      collectionId: chosenCollection.value!.id,
      nonUserCharacterIds: [...selectedCharactes.value.values()].map(
        (c) => c.id
      ),
      userCharacterId: chosenProtagonist.value!.id,
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
  h2.text-lg.leading-none 1. Choose collection
  .flex.flex-col.gap-3
    .grid.grid-cols-4.gap-3
      CollectionListItem(
        v-for="collection in collections"
        :key="collection.id"
        :collection="collection"
        :selected="collection === chosenCollection"
        @click="chosenCollection = collection"
      )

    CollectionCard(
      v-if="chosenCollection"
      :key="chosenCollection.id"
      :collection="chosenCollection"
    )

  template(v-if="chosenCollection")
    h2.text-lg.leading-none 2. Choose protagonist
    .flex.flex-col.gap-3
      .grid.grid-cols-8.gap-3
        CharacterListItem(
          v-for="character in characters.filter((c) => c.collection.ref.value?.id === chosenCollection?.id)"
          :key="character.id"
          :character="character"
          :selected="character === chosenProtagonist"
          @click="chosenProtagonist = character; selectedCharactes.delete(character)"
        )

      CharacterCard(
        v-if="chosenProtagonist"
        :key="chosenProtagonist.id"
        :character="chosenProtagonist"
      )

    template(v-if="chosenProtagonist")
      h2.text-lg.leading-none 3. Choose characters
      .flex.flex-col.gap-3
        .grid.grid-cols-8.gap-3
          CharacterListItem(
            v-for="character in characters.filter((c) => c.collection.ref.value?.id === chosenCollection?.id)"
            :key="character.id"
            :character="character"
            :selected="selectedCharactes.has(character)"
            :disabled="chosenProtagonist === character"
            @click="chosenProtagonist === character ? null : selectedCharactes.has(character) ? selectedCharactes.delete(character) : selectedCharactes.add(character)"
          )

        CharacterCard(
          v-for="character in selectedCharactes"
          :key="character.id"
          :character="character"
        )

      template(v-if="selectedCharactes.size > 0")
        h2.text-lg.leading-none 4. Write fabula (optional)
        textarea.w-full.rounded.border.p-3.leading-tight(
          class="min-h-[4rem]"
          v-model="fabula"
          placeholder="Write your story here..."
        )

        button.btn.btn-primary.w-full(@click="create" :disabled="!mayCreate") Embark 🚀
</template>
