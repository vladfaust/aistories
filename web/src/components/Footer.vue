<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as api from "@/services/api";

const twitterLink = ref();
const discordLink = ref();

onMounted(() => {
  api.trpc.commands.settings.get.query("discordLink").then((res) => {
    discordLink.value = res;
  });

  api.trpc.commands.settings.get.query("twitterLink").then((res) => {
    twitterLink.value = res;
  });
});
</script>

<template lang="pug">
footer.flex.h-16.w-full.justify-center.border-y.p-4
  .flex.w-full.max-w-3xl.items-center.justify-between
    ul.flex.gap-3
      li aistories.xyz © 2023
    ul.flex.gap-3
      li
        a.link-hover(:href="discordLink") Discord
      li
        a.link-hover(:href="twitterLink") Twitter
</template>
