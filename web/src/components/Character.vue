<script setup lang="ts">
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { account } from "@/services/eth";
import * as web3Auth from "@/services/web3Auth";
import { ref, type Ref, watch } from "vue";

const { char } = defineProps<{
  char: Character;
}>();

const sessionActive: Ref<boolean | undefined> = ref();

watch(
  account,
  async (account) => {
    if (account) {
      const activeSession = await trpc.chat.session.findActive.query({
        authToken: await web3Auth.ensure(),
        chat: {
          characterId: char.id,
        },
      });

      sessionActive.value = !!activeSession.sessionId;
    }
  },
  {
    immediate: true,
  }
);
</script>

<template lang="pug">
.flex
  img.aspect-square.w-32.rounded.object-contain(:src="char.imagePreviewUrl")
  .flex.flex-col.gap-2
    span.text-xl.font-semibold.leading-none {{ char.name }}
    p.leading-tight {{ char.about }}
    .flex
      router-link.btn.leading-none(
        :to="'/chat/' + char.id"
        :class="{ 'btn-primary': !sessionActive, 'btn-success': sessionActive }"
      )
        span(v-if="sessionActive") Continue simulation
        span(v-else) Open controls
</template>
