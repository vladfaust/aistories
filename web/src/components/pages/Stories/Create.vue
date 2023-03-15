<script setup lang="ts">
import Character from "@/models/Character";
import Lore from "@/models/Lore";
import * as api from "@/services/api";
import { ensureWeb3Token, userId, web3Token } from "@/store";
import { computed, ref, shallowRef, type Ref, type ShallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import LoreCard from "@/components/Lore/Card.vue";
import LoreSummary from "@/components/Lore/Summary.vue";
import CharCard from "@/components/Character/Card.vue";
import CharSummary from "@/components/Character/Summary.vue";
import nProgress from "nprogress";
import { useSessionStorage } from "@vueuse/core";

const CHAR_LIMIT = 1;

const route = useRoute();
const router = useRouter();

const lores: ShallowRef<Lore[]> = ref([]);
const characters: ShallowRef<Character[]> = ref([]);

const promises = [
  api.trpc.commands.lores.index.query().then(async (ids) => {
    lores.value = (await Promise.all(
      ids.map((id) => Lore.findOrCreate(id).promise)
    )) as Lore[];
  }),

  api.trpc.commands.characters.index.query().then(async (ids) => {
    characters.value = (await Promise.all(
      ids.map((id) => Character.findOrCreate(id).promise)
    )) as Character[];
  }),
];

await Promise.all(promises);
nProgress.done();

const chosenLore: ShallowRef<Lore | undefined> = shallowRef();
const chosenProtagonist: ShallowRef<Character | undefined> = shallowRef();
const selectedCharactes: ShallowRef<Set<Character>> = ref(new Set());

const chosenLoreStore = useSessionStorage<number | undefined>(
  "newStory:chosenLore",
  undefined
);

function chooseLore(loreId: number) {
  const lore = lores.value.find((l) => l.id == loreId);
  if (!lore) return;

  chosenLore.value = lore;
  chosenProtagonist.value = undefined;
  selectedCharactes.value.clear();

  chosenLoreStore.value = loreId;
}

function chooseProtagonist(charId: number) {
  const char = characters.value.find((c) => c.id == charId);
  if (!char) return;

  chosenProtagonist.value = char;
  selectedCharactes.value.delete(char);
}

function selectCharacter(charId: number) {
  const char = characters.value.find((c) => c.id == charId);
  if (!char) return;

  if (char === chosenProtagonist.value) return;

  if (selectedCharactes.value.has(char)) {
    selectedCharactes.value.delete(char);
  } else {
    selectedCharactes.value.add(char);
  }
}

if (route.query.loreId) {
  chooseLore(Number(route.query.loreId));
} else if (chosenLoreStore.value) {
  chooseLore(chosenLoreStore.value);
}

if (route.query.charId) {
  chooseProtagonist(Number(route.query.charId));
}

const fabula: Ref<string | undefined> = ref();

const mayCreate = computed(() => {
  return (
    !createInProgress.value &&
    chosenLore.value &&
    chosenProtagonist.value &&
    chosenProtagonist.value.collected.value &&
    selectedCharactes.value.size > 0 &&
    selectedCharactes.value.size <= CHAR_LIMIT &&
    [...selectedCharactes.value].every((c) => c.collected.value)
  );
});
const createInProgress = ref(false);

async function create() {
  if (!mayCreate.value) return;

  if (!userId.value) {
    alert("You must be logged in to create a story.");
    return;
  }

  createInProgress.value = true;

  try {
    if (
      chosenProtagonist.value?.nft.value ||
      [...selectedCharactes.value].find((c) => c.nft.value)
    ) {
      await ensureWeb3Token();
    }

    const storyId = await api.trpc.commands.story.create.mutate({
      loreId: chosenLore.value!.id,
      nonUserCharacterIds: [...selectedCharactes.value.values()].map(
        (c) => c.id
      ),
      userCharacterId: chosenProtagonist.value!.id,
      fabula: fabula.value,
      web3Token: web3Token.value || undefined,
    });

    router.push(`/story/${storyId}`);
  } catch (e: any) {
    alert(e.message);
    console.error(e);
  } finally {
    createInProgress.value = false;
  }
}
</script>

<template lang="pug">
.flex.h-full.w-full.max-w-3xl.flex-col.gap-3.overflow-y-auto
  h2.text-lg.leading-none 1. Choose lore
  .flex.flex-col.gap-3
    .grid.grid-cols-2.gap-2.sm_grid-cols-4.sm_gap-3
      LoreCard.pressable.cursor-pointer.gap-2.rounded.border.p-2.transition-transform(
        v-for="lore in lores"
        :key="lore.id"
        :lore="lore"
        :class="{ 'border border-primary-500': lore === chosenLore }"
        :click="() => chooseLore(lore.id)"
      )

    .grid.gap-3.rounded.border.border-primary-500.p-3.shadow-lg.sm_grid-cols-4(
      v-if="chosenLore"
    )
      LoreCard.pressable.hidden.cursor-pointer.gap-2.rounded.border.p-3.transition-transform.sm_flex(
        :lore="chosenLore"
      )
      LoreSummary.sm_col-span-3(:lore="chosenLore")

  template(v-if="chosenLore")
    h2.text-lg.leading-none 2. Choose protagonist
    .flex.flex-col.gap-3
      .grid.grid-cols-2.gap-2.sm_grid-cols-5
        CharCard.pressable.cursor-pointer.gap-2.rounded.border.p-2.transition-transform(
          v-for="character in characters.filter((c) => c.lore.ref.value?.id === chosenLore?.id)"
          :char="character"
          :selected="character === chosenProtagonist"
          :class="chosenProtagonist === character ? (character.collected.value ? 'border-primary-500' : 'border-error-500') : ''"
          :click="() => chooseProtagonist(character.id)"
        )

      .grid.gap-3.rounded.border.p-3.shadow-lg.sm_grid-cols-4(
        v-if="chosenProtagonist"
        :class="chosenProtagonist.collected.value ? 'border-primary-500' : 'border-error-500'"
      )
        CharCard.pressable.hidden.cursor-pointer.gap-2.rounded.border.p-3.transition-transform.sm_flex(
          :char="chosenProtagonist"
        )
        CharSummary.sm_col-span-3(:char="chosenProtagonist")

    template(v-if="chosenProtagonist?.collected.value")
      h2.text-lg.leading-none(
        :class="{ 'text-error-500': selectedCharactes.size > CHAR_LIMIT }"
      ) 3. Choose characters ({{ selectedCharactes.size }}/{{ CHAR_LIMIT }})
      .flex.flex-col.gap-3
        .grid.grid-cols-2.gap-2.sm_grid-cols-5
          CharCard.gap-2.rounded.border.p-2(
            v-for="character in characters.filter((c) => c.lore.ref.value?.id === chosenLore?.id)"
            :key="character.id"
            :char="character"
            :selected="selectedCharactes.has(character)"
            :class="{ 'cursor-pointer pressable transition-transform': chosenProtagonist !== character, 'cursor-not-allowed grayscale opacity-50': chosenProtagonist === character, 'border-primary-500': selectedCharactes.has(character) && character.collected.value, 'border-error-500': selectedCharactes.has(character) && !character.collected.value }"
            :click="() => selectCharacter(character.id)"
          )

        .grid.grid-cols-4.gap-3.rounded.border.p-3.shadow-lg(
          v-for="character in selectedCharactes"
          :class="character.collected.value ? 'border-primary-500' : 'border-error-500'"
        )
          CharCard.pressable.cursor-pointer.gap-2.rounded.border.p-3.transition-transform(
            :key="character.id"
            :char="character"
          )
          CharSummary.col-span-3(:char="character" :key="character.id")

      template(
        v-if="selectedCharactes.size > 0 && selectedCharactes.size <= CHAR_LIMIT && [...selectedCharactes].every((c) => c.collected.value)"
      )
        h2.text-lg.leading-none 4. Write fabula (optional)
        textarea.w-full.rounded.border.p-3.leading-tight(
          class="min-h-[4rem]"
          v-model="fabula"
          placeholder="Write your story here..."
        )

        button.btn.btn-primary.w-full(@click="create" :disabled="!mayCreate") Embark 🚀
</template>
