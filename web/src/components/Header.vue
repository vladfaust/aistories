<script setup lang="ts">
/// <reference types="vite-svg-loader" />
import Jdenticon from "./utility/Jdenticon.vue";
import { userId } from "@/store";
import * as oAuth from "@/services/oAuth";
import DiscordLogo from "@/assets/discord.svg?component";
</script>

<template lang="pug">
header.flex.h-16.w-full.place-content-center.border-y.px-4
  .grid.h-full.w-full.max-w-3xl.grid-cols-3
    ul._left.flex.items-center.gap-6
      li
        RouterLink.pressable.block.text-lg.transition-transform(to="/")
          | aistories.xyz
          span.select-none ™️
    .flex.items-center.justify-center
    ul.flex.items-center.justify-end.gap-2
      template(v-if="userId")
        li
          RouterLink.pressable.flex.items-center.gap-2.transition-transform(
            to="/me"
          )
            Jdenticon.h-8.w-8.rounded.border(:input="userId")
      li(v-else)
        a.btn.btn-sm.gap-2.text-white(
          class="bg-[#5865F2]"
          :href="oAuth.url(oAuth.Provider.Discord)"
        )
          | Log in
          DiscordLogo.h-5.fill-white
</template>
