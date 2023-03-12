<script setup lang="ts">
import Character from "@/models/Character";
import Lore from "@/models/Lore";
import * as api from "@/services/api";
import { userId, web3Token } from "@/store";
import { computed, onMounted, ref, type Ref, type ShallowRef } from "vue";
import { useRouter } from "vue-router";
import LoreCard from "@/components/Lore/Card.vue";
import LoreSummary from "@/components/Lore/Summary.vue";
import CharCard from "@/components/Character/Card.vue";
import CharSummary from "@/components/Character/Summary.vue";
import Web3Token from "web3-token";
import * as eth from "@/services/eth";
import config from "@/config";

const CHAR_LIMIT = 1;

const router = useRouter();

const lores: ShallowRef<Lore[]> = ref([]);
const chosenLore: Ref<Lore | undefined> = ref();

const characters: ShallowRef<Character[]> = ref([]);
const chosenProtagonist: ShallowRef<Character | null> = ref(null);
const selectedCharactes: ShallowRef<Set<Character>> = ref(new Set());
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

onMounted(() => {
  api.trpc.commands.lores.index.query().then(async (ids) => {
    lores.value = (await Promise.all(
      ids.map((id) => Lore.findOrCreate(id).promise)
    )) as Lore[];
  });

  api.trpc.commands.character.index.query().then(async (ids) => {
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

  if (
    chosenProtagonist.value?.erc1155Token ||
    [...selectedCharactes.value].find((c) => c.erc1155Token)
  ) {
    if (!eth.provider.value) {
      alert(
        "You must be connected to Ethereum to create a story with NFT characters."
      );

      return;
    }

    web3Token.value ||= await Web3Token.sign(
      async (msg: string) => eth.provider.value!.getSigner().signMessage(msg),
      {
        domain: import.meta.env.PROD ? config.trpcHttpUrl.hostname : undefined,
        expires_in: 60 * 60 * 24 * 1000, // 1 day
      }
    );
  }

  try {
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
    .grid.grid-cols-3.gap-3.sm_grid-cols-5
      LoreCard.pressable.cursor-pointer.gap-2.rounded.border.p-2.transition-transform(
        v-for="lore in lores"
        :key="lore.id"
        :lore="lore"
        :class="{ 'border border-primary-500': lore === chosenLore }"
        :click="() => { chosenLore = lore; chosenProtagonist = null; selectedCharactes.clear(); }"
      )

    .grid.grid-cols-4.gap-3.rounded.border.border-primary-500.p-3(
      v-if="chosenLore"
    )
      LoreCard.pressable.cursor-pointer.gap-2.rounded.border.p-3.transition-transform(
        :lore="chosenLore"
      )
      LoreSummary.col-span-3(:lore="chosenLore")

  template(v-if="chosenLore")
    h2.text-lg.leading-none 2. Choose protagonist
    .flex.flex-col.gap-3
      .grid.grid-cols-4.gap-3.sm_grid-cols-5
        CharCard.pressable.cursor-pointer.rounded.border.p-3.transition-transform(
          v-for="character in characters.filter((c) => c.lore.ref.value?.id === chosenLore?.id)"
          :char="character"
          :selected="character === chosenProtagonist"
          :class="chosenProtagonist === character ? (character.collected.value ? 'border-primary-500' : 'border-error-500') : ''"
          :click="() => { chosenProtagonist = character; selectedCharactes.delete(character); }"
        )

      .grid.grid-cols-4.gap-3.rounded.border.p-3(
        v-if="chosenProtagonist"
        :class="chosenProtagonist.collected.value ? 'border-primary-500' : 'border-error-500'"
      )
        CharCard.pressable.cursor-pointer.gap-2.rounded.border.p-3.transition-transform(
          :char="chosenProtagonist"
        )
        CharSummary.col-span-3(:char="chosenProtagonist")

    template(v-if="chosenProtagonist?.collected.value")
      h2.text-lg.leading-none(
        :class="{ 'text-error-500': selectedCharactes.size > CHAR_LIMIT }"
      ) 3. Choose characters ({{ selectedCharactes.size }}/{{ CHAR_LIMIT }})
      .flex.flex-col.gap-3
        .grid.grid-cols-4.gap-3.sm_grid-cols-5
          CharCard.rounded.border.p-3(
            v-for="character in characters.filter((c) => c.lore.ref.value?.id === chosenLore?.id)"
            :key="character.id"
            :char="character"
            :selected="selectedCharactes.has(character)"
            :class="{ 'cursor-pointer pressable transition-transform': chosenProtagonist !== character, 'cursor-not-allowed grayscale': chosenProtagonist === character, 'border-primary-500': selectedCharactes.has(character) && character.collected.value, 'border-error-500': selectedCharactes.has(character) && !character.collected.value }"
            :click="() => { chosenProtagonist === character ? null : selectedCharactes.has(character) ? selectedCharactes.delete(character) : selectedCharactes.add(character); }"
          )

        .grid.grid-cols-4.gap-3.rounded.border.p-3(
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
