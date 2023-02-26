<script setup lang="ts">
import { trpc } from "@/services/api";
import { ref, type ShallowRef, watchEffect, markRaw, onUnmounted } from "vue";
import * as web3Auth from "@/services/web3Auth";
import { account } from "@/services/eth";
import Story from "@/models/Story";
import Character from "@/models/Character";
import { Deferred } from "@/utils/deferred";
import { useRouter } from "vue-router";

const router = useRouter();

const stories: ShallowRef<Story[]> = ref([]);

const cancelWatch = watchEffect(async () => {
  stories.value = [];

  if (account.value) {
    stories.value = (
      await trpc.story.list.query({
        authToken: await web3Auth.ensure(),
      })
    ).map((data) =>
      markRaw(
        new Story(
          data.id,
          data.userId,
          Character.findOrCreate(data.characterId) as Deferred<Character>,
          data.name
        )
      )
    );

    if (stories.value.length === 0) {
      router.push("/stories/new");
    }
  }
});

onUnmounted(cancelWatch);
</script>

<template lang="pug">
.flex.w-full.justify-center.p-4
  .flex.w-full.max-w-3xl.flex-col.items-center.gap-6.py-8
    h1.text-2xl.font-extrabold.uppercase.leading-none.tracking-wider Stories
    RouterLink.btn.btn-primary(to="/stories/new") Embark a new story
    .flex.w-full.flex-col.gap-3.rounded-lg
      RouterLink.pressable-wide.flex.w-full.items-center.gap-2.rounded-lg.border.p-3.transition-transform(
        :to="'/stories/' + story.id"
        v-for="story in stories"
      )
        img.w-16.rounded-full.bg-base-50(
          v-if="story.character.ref.value"
          :src="story.character.ref.value.imagePreviewUrl.toString()"
        )
        .flex.flex-col
          span.italic {{ story.name || "Story with " + story.character.ref.value?.name }}
</template>
