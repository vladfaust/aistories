<script setup lang="ts">
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { account } from "@/services/eth";
import * as web3Auth from "@/services/web3Auth";
import { useNow } from "@vueuse/core";
import { ref, type Ref, watch, computed } from "vue";
import { format } from "date-fns";

const now = useNow();

const { char } = defineProps<{
  char: Character;
}>();

const session: Ref<
  | {
      id: number;
      endedAt: Date;
    }
  | null
  | undefined
> = ref();

const sessionActive = computed(() => {
  if (!session.value) return false;
  return session.value.endedAt > now.value;
});

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

      if (activeSession) {
        session.value = {
          id: activeSession.id,
          endedAt: new Date(activeSession.endedAt),
        };
      } else {
        session.value = null;
      }
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
        span(v-if="session && sessionActive") Continue simulation ({{ format(new Date(session.endedAt.valueOf() - now.valueOf()), "mm:ss") }})
        span(v-else) Open interface
</template>
