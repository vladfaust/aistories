<script setup lang="ts">
import Jdenticon from "@/components/utility/Jdenticon.vue";
import * as api from "@/services/api";

const user = (await api.trpc.commands.me.getDiscord.query())!;
</script>

<template lang="pug">
.flex.items-center.gap-1(v-if="user")
  img.h-8.rounded-full.border(
    v-if="user.avatar"
    :src="'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png'"
  )
  Jdenticon.h-8(v-else :input="user.id")
  .flex.flex-col
    span.text-sm.leading-none {{ user.username }}
    span.text-sm.text-xs.leading-none.text-base-400 \#{{ user.discriminator }}
</template>
