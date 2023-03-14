<script setup lang="ts">
import Character from "@/models/Character";
import Story from "@/models/Story";
import { ensureWeb3Token, web3Token } from "@/store";
import { PlusIcon } from "@heroicons/vue/24/outline";
import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import { ref, triggerRef } from "vue";

const { story } = defineProps<{
  story: Story;
}>();

const nameRef = ref<HTMLSpanElement | null>(null);

async function addChar() {
  let newCharId = prompt(
    "Enter the ID of the character you want to add to the story."
  );
  if (!newCharId) return;

  const newChar = Character.findOrCreate(parseInt(newCharId));
  await newChar.promise;
  if (!newChar.ref.value) {
    alert("Could not find a character with that ID.");
    return;
  }

  try {
    if (newChar.ref.value.nft) {
      if (!newChar.ref.value.collected.value) {
        alert("You must collect this character's NFT to add it to a story.");
        return;
      }

      await ensureWeb3Token();
    }

    await api.trpc.commands.story.addChar.mutate({
      storyId: story.id,
      charId: newChar.ref.value.id,
      web3Token: web3Token.value || undefined,
    });

    story.characters.value.push(newChar as Deferred<Character>);
    triggerRef(story.characters);
  } catch (e: any) {
    alert(e.message);
    throw e;
  }
}

async function removeChar(char: Character) {
  if (char == story.user.char.ref.value) {
    alert("You cannot remove the main character from a story.");
    return;
  }

  if (story.characters.value.length == 2) {
    alert("You must have at least 2 characters in a story.");
    return;
  }

  if (!confirm("Are you sure you want to remove this character?")) return;

  try {
    await api.trpc.commands.story.removeChar.mutate({
      storyId: story.id,
      charId: char.id,
    });

    story.characters.value = story.characters.value.filter(
      (c) => c.ref.value !== char
    );

    triggerRef(story.characters);
  } catch (e: any) {
    alert(e.message);
    throw e;
  }
}

async function updateName() {
  const name = nameRef.value?.innerText;

  if (!name) return;
  if (name == story.name.value) return;

  await api.trpc.commands.story.setName.mutate({
    storyId: story.id,
    name,
  });

  story.name.value = name;
  nameRef.value?.blur();
}
</script>

<template lang="pug">
.box-border.flex.items-center.justify-between.p-3
  .flex.items-center.gap-2
    img.box-content.h-8.w-8.rounded.border.bg-base-50.object-cover(
      v-if="story.lore.ref.value?.imageUrl"
      :src="story.lore.ref.value?.imageUrl.toString()"
    )
    .flex.gap-1
      template(v-for="character in story.characters.value.slice().reverse()")
        img.pressable.box-content.h-8.w-8.cursor-pointer.rounded-full.border.bg-base-50.object-cover.transition(
          v-if="character.ref.value"
          :src="character.ref.value.imageUrl.toString()"
          @click="character.ref.value ? removeChar(character.ref.value) : undefined"
          title="Remove this character from the story"
        )
      .pressable.box-content.flex.h-8.w-8.cursor-pointer.items-center.justify-center.rounded-full.border(
        @click="addChar"
        title="Add a character to the story"
      )
        PlusIcon.h-4.w-4.text-base-300

    span.font-semibold.leading-tight(
      contenteditable
      spellcheck="false"
      @keydown.enter.prevent="updateName"
      ref="nameRef"
    )
      | {{ story.name.value || story.lore.ref.value?.name.value + " with " + story.characters.value.map((c) => c.ref.value?.name.value).join(", ") }}
</template>
