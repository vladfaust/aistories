<script setup lang="ts">
import EnergyIcon from "@/components/utility/EnergyIcon.vue";
import Spinner2 from "@/components/utility/Spinner2.vue";
import * as api from "@/services/api";
import nProgress from "nprogress";
import { ref, watchEffect } from "vue";

const [discordLink, grantAmount, granted_] = await Promise.all([
  (await api.trpc.commands.settings.get.query("discordLink"))!,
  parseFloat(
    (await api.trpc.commands.settings.get.query(
      "discordGuildMembershipEnergyGrant"
    ))!
  ),
  api.trpc.commands.me.energy.getDiscordClaimed.query(),
]);

const claimInProgress = ref(false);
watchEffect(() =>
  claimInProgress.value ? nProgress.start() : nProgress.done()
);

const granted = ref(granted_);

async function claim() {
  if (claimInProgress.value) return;
  if (granted_) throw new Error("Already claimed");

  claimInProgress.value = true;

  try {
    const energyClaimed =
      await api.trpc.commands.me.energy.claimDiscord.mutate();
    alert(`Claimed ${energyClaimed} energy credits`);
    granted.value = true;
  } catch (e: any) {
    console.error(e);
    alert(e.message);
  } finally {
    claimInProgress.value = false;
  }
}
</script>

<template lang="pug">
.flex.flex-col
  p.place-self-center.rounded.bg-base-50.p-3.text-center.leading-tight.text-base-600
    | Claim FREE energy credits for joining the
    |
    a.link.text-primary-500(:href="discordLink") AIStories Discord guild

  button.btn-raised.btn.w-full.gap-1.text-white(
    v-if="!granted"
    class="bg-[#5865F2]"
    @click="claim"
    :disabled="claimInProgress"
  )
    Spinner2.h-5(v-if="claimInProgress")
    template(v-else)
      span Claim
      .flex.items-center
        EnergyIcon.h-5
        span {{ grantAmount }}

  button.btn.w-full(v-else disabled) Already claimed
</template>
