<script setup lang="ts">
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { ref, watch, type Ref } from "vue";
import Chat from "./Messenger/Chat.vue";
import Contacts from "./Messenger/Contacts.vue";
import Profile from "./Messenger/Profile.vue";

const chosenCharacterId: Ref<number | null> = ref(null);
const chosenCharacter: Ref<Character | null> = ref(null);

watch(
  chosenCharacterId,
  async (id) => {
    if (id) {
      chosenCharacter.value = await trpc.character.find.query({
        id,
      });
    } else {
      chosenCharacter.value = null;
    }
  },
  { immediate: true }
);
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4
  Splitpanes.w-full.rounded-lg.border(style="height: calc(100vh - 7rem)")
    Pane(min-size="4rem" max-size="25" size="25")
      Contacts(@select="chosenCharacterId = $event")
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
