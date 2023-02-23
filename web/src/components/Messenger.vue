<script setup lang="ts">
import { Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { ref, type ShallowRef, type Ref, computed, onMounted } from "vue";
import Chat from "./Messenger/Chat.vue";
import Contacts from "./Messenger/Contacts.vue";
import Profile from "./Messenger/Profile.vue";

const characters: ShallowRef<Character[]> = ref([]);
const chosenCharacterId: Ref<number | null> = ref(null);
const chosenCharacter = computed(() => {
  if (!chosenCharacterId.value) return null;
  return characters.value.find((c) => c.id === chosenCharacterId.value)!;
});

onMounted(() => {
  trpc.character.getAll.query().then((cs) => {
    characters.value = cs.map((c) => new Character(c));
  });
});
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4
  Splitpanes.w-full.rounded-lg.border(style="height: calc(100vh - 7rem)")
    Pane(min-size="4rem" max-size="25" size="25")
      Contacts(:characters="characters" @select="chosenCharacterId = $event")
    Pane
      Suspense
        Chat(
          v-if="chosenCharacter"
          :character="chosenCharacter"
          :key="chosenCharacter.id"
        )
    Pane(max-size="25" size="25")
      Profile(v-if="chosenCharacter" :character="chosenCharacter")
</template>

<style lang="scss">
// .splitpanes__pane {
//   box-shadow: 0 0 5px rgba(0, 0, 0, 0.2) inset;
//   justify-content: center;
//   align-items: center;
//   display: flex;
// }

.splitpanes__splitter {
  position: relative;

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.4s;
    background-color: rgba(255, 0, 0, 0.3);
    opacity: 0;
    z-index: 1;
  }
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 1px;
  background-color: #e5e7eb;

  &:before {
    left: -10px;
    right: -10px;
    height: 100%;
  }
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 1px;
  background-color: #e5e7eb;

  &:before {
    top: -10px;
    bottom: -10px;
    width: 100%;
  }
}
</style>
