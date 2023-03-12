<script setup lang="ts">
import Jdenticon from "./utility/Jdenticon.vue";
import { userId, energy } from "@/store";
import * as oAuth from "@/services/oAuth";
import DiscordLogo from "@/assets/discord.svg?component";
import EnergyIcon from "@/components/utility/EnergyIcon.vue";
import Placeholder from "./utility/Placeholder.vue";
</script>

<template lang="pug">
header.flex.h-16.w-full.place-content-center.border-y.px-4
  .grid.h-full.w-full.max-w-3xl.grid-cols-2
    ul._left.flex.items-center.gap-6
      li
        RouterLink.pressable.block.text-lg.transition-transform(to="/")
          span.text-base-400 β.
          | aistories.xyz
          span.select-none ™️
      li
        RouterLink.pressable.block.text-base.transition-transform(to="/lores")
          | Lores
      li
        RouterLink.pressable.block.text-base.transition-transform(to="/chars")
          | Chars
    ul.flex.items-center.justify-end.gap-2
      template(v-if="userId")
        li
          RouterLink.pressable.flex.items-center.transition-transform(to="/me")
            EnergyIcon.h-5
            span.text-sm.text-base-600(v-if="energy !== undefined") {{ energy }}
            Placeholder.h-5.w-8.rounded.bg-base-100(v-else)
        li
          RouterLink.pressable.flex.items-center.gap-2.transition-transform(
            to="/me"
          )
            Jdenticon.h-8.w-8.rounded-full.border(:input="userId" class="p-0.5")
      li(v-else)
        a.btn.btn-sm.gap-2.text-white(
          class="bg-[#5865F2]"
          :href="oAuth.url(oAuth.Provider.Discord, ['identify', 'guilds.members.read'])"
        )
          | Log in
          DiscordLogo.h-5.fill-white
</template>
