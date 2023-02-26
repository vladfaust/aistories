<script setup lang="ts">
import Character from "@/models/Character";
import { trpc } from "@/services/api";
import { computed, onMounted, ref, type Ref, type ShallowRef } from "vue";
import { LockClosedIcon } from "@heroicons/vue/24/outline";
import { tap } from "@/utils";
import * as web3Auth from "@/services/web3Auth";
import { useRouter } from "vue-router";

const characters: ShallowRef<Character[]> = ref([]);
const chosenCharacter: Ref<Character | null> = ref(null);
const fabula: Ref<string | undefined> = ref();
const router = useRouter();

const mayCreate = computed(() => {
  return (
    !createInProgress.value &&
    chosenCharacter.value !== null &&
    chosenCharacter.value.collected.value
  );
});
const createInProgress = ref(false);

onMounted(() => {
  trpc.character.getAll.query().then((datum) => {
    characters.value = datum.map((data) => {
      return tap(Character.fromBackendModel(data), (c) => c.watchBalance());
    });
  });
});

async function create() {
  if (!mayCreate.value) return;
  createInProgress.value = true;

  try {
    const storyId = await trpc.story.create.mutate({
      authToken: await web3Auth.ensure(),
      characterId: chosenCharacter.value!.id,
      fabula: fabula.value,
    });

    router.push(`/stories/${storyId}`);
  } finally {
    createInProgress.value = false;
  }
}
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4
  .flex.w-full.max-w-3xl.flex-col.gap-4.py-6
    h1.text-3xl.font-extrabold.uppercase.leading-none.tracking-wider New story

    h2.text-xl.leading-none Choose character
    .flex.flex-col.gap-3
      .grid.grid-cols-6.gap-3
        template(v-for="character in characters")
          template(v-if="character.collected.value")
            img.pressable.aspect-square.cursor-pointer.select-none.rounded.bg-base-50.transition.hover_opacity-100(
              :src="character.imagePreviewUrl.toString()"
              :class="character === chosenCharacter ? 'opacity-100' : 'opacity-50'"
              @click="chosenCharacter = character"
            )
          template(v-else)
            .pressable.transitio.relative.cursor-pointer.select-none.items-center.justify-center.overflow-hidden.transition.hover_opacity-100(
              :class="character === chosenCharacter ? 'opacity-100' : 'opacity-50'"
              @click="chosenCharacter = character"
            )
              img.aspect-square.rounded.bg-base-50.brightness-50.grayscale(
                :src="character.imagePreviewUrl.toString()"
              )
              LockClosedIcon.absolute-centered.z-10.h-8.w-8.text-white
      .flex.flex-col.gap-3.rounded.border.p-4.sm_flex-row(
        v-if="chosenCharacter"
      )
        img.aspect-square.rounded.bg-base-50.object-contain.sm_w-48(
          :src="chosenCharacter.imagePreviewUrl.toString()"
          :class="{ grayscale: !chosenCharacter.collected.value }"
        )
        .flex.flex-col.gap-1
          span.text-lg.font-bold.leading-tight {{ chosenCharacter.name }}
          span.text-sm.leading-tight.text-base-500 {{ chosenCharacter.title }}
          p.leading-tight {{ chosenCharacter.about }}
          .mt-1.flex.items-center.gap-2(v-if="chosenCharacter.erc1155Token")
            a.btn.btn-nft(:href="chosenCharacter.erc1155Token.uri.toString()")
              span(v-if="chosenCharacter.collected.value") See NFT
              span(v-else) Collect NFT to unlock
            span.text-sm.text-gray-400(v-if="chosenCharacter.collected.value") {{ chosenCharacter.balance.value }} collected

    h2.text-xl Write fabula (optional)

    textarea.w-full.rounded.border.p-4(
      v-model="fabula"
      rows=3
      placeholder="Write your story here..."
    )

    button.btn.btn-primary.btn-lg(@click="create" :disabled="!mayCreate") Embark
</template>
