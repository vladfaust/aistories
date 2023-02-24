<script setup lang="ts">
import { Character } from "@/models/Character";
import { trpc } from "@/services/api";
import {
  ref,
  type ShallowRef,
  type Ref,
  computed,
  onMounted,
  type WatchStopHandle,
  onUnmounted,
  watch,
} from "vue";
import Chat from "./Messenger/Chat.vue";
import Contacts from "./Messenger/Contacts.vue";
import Profile from "./Messenger/Profile.vue";

const characters: ShallowRef<Character[]> = ref([]);
const chosenCharacterId: Ref<number | null> = ref(null);
const chosenCharacter = computed(() => {
  if (!chosenCharacterId.value) return null;
  return characters.value.find((c) => c.id === chosenCharacterId.value)!;
});
const watchers: WatchStopHandle[] = [];

const displayContacts = ref(true);
const displayProfile = ref(true);

onMounted(() => {
  trpc.character.getAll.query().then((datum) => {
    characters.value = datum.map((data) => {
      const c = Character.fromBackendModel(data);
      watchers.push(c.watchBalance());
      return c;
    });
  });
});

onUnmounted(() => {
  watchers.forEach((w) => w());
});

watch(displayProfile, (val) => {
  console.log("displayProfile", val);
});
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4
  .flex.w-full.max-w-7xl.divide-x.rounded-lg.border(
    style="height: calc(100vh - 7rem)"
  )
    Contacts(
      :class="'w-1/4'"
      :characters="characters"
      :displayDetails="true"
      @select="chosenCharacterId = $event"
    )

    Suspense(v-if="chosenCharacter && chosenCharacter.collected.value")
      Chat(
        :class="displayProfile ? 'w-2/4' : 'w-3/4'"
        :character="chosenCharacter"
        :key="chosenCharacter.id"
        @toggle-contacts="displayContacts = !displayContacts"
        @toggle-profile="displayProfile = !displayProfile"
      )

    template(v-if="chosenCharacter")
      .flex.h-full.items-center.justify-center(
        v-if="displayProfile"
        :class="chosenCharacter.collected.value ? 'w-1/4' : 'w-3/4'"
      )
        Profile.min-h-min.max-w-sm(
          v-if="displayProfile"
          :character="chosenCharacter"
          :key="chosenCharacter.id"
        )

    .flex.h-full.flex-col.items-center.justify-center.p-4(v-else class="w-3/4")
      .text-2xl.font-bold.text-base-500
        | Select a character to view their profile
      .text-base-500
        | You can also view your profile by clicking on your avatar in the top right corner
</template>
