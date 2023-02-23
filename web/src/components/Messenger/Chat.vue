<script setup lang="ts">
import { Character } from "@/models/Character";
import HeaderVue from "./Chat/Header.vue";
import Messages from "./Chat/Messages.vue";
import InputVue from "./Chat/Input.vue";

const { character } = defineProps<{
  character: Character;
}>();
</script>

<template lang="pug">
.flex.h-full.flex-col
  HeaderVue.w-full.border-b(:character="character" v-if="character")
  Messages.w-full(:character="character")
  InputVue.w-full.border-t(:character="character")
</template>
