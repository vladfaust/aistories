<script setup lang="ts">
import * as api from "@/services/api";
import { ref, type ShallowRef, watchEffect, onUnmounted } from "vue";
import { userId } from "@/store";
import Story from "@/models/Story";

const stories: ShallowRef<Story[]> = ref([]);

const cancelWatch = watchEffect(async () => {
  stories.value = [];

  if (userId.value) {
    stories.value = (await api.trpc.commands.story.list.query()).map((data) =>
      Story.fromBackendModel(data)
    );
  }
});

onUnmounted(cancelWatch);
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  p.bg-nft.bg-x2.w-full.animate-bg-position.rounded.p-8.text-center.leading-none.text-white.shadow
    span.text-3xl.font-medium
      | aistories.xyz
      span.select-none ™️
    br
    span.text-lg
      | is&nbsp;
      i the
      | &nbsp;place to relive infinite stories with AI characters.
    br
    span.text-2xl ❤️💀🤖

  RouterLink.btn.btn-primary.w-full(to="/story/new") Embark new story ✨

  .flex.w-full.flex-col.gap-2.overflow-y-auto(v-if="stories.length > 0")
    .flex.w-full.items-center.justify-between.gap-2.rounded.border.p-3(
      v-for="story in stories"
    )
      .flex.shrink-0.gap-1
        img.mr-6.box-content.h-10.w-10.rounded.border.bg-base-50.object-cover(
          v-if="story.collection.ref.value?.imageUrl"
          :src="story.collection.ref.value?.imageUrl.toString()"
        )

        template(v-for="character in story.characters.slice().reverse()")
          img.-ml-6.box-content.h-10.w-10.rounded-full.border.bg-base-50.object-cover(
            v-if="character.ref.value"
            :src="character.ref.value.imagePreviewUrl.toString()"
          )

      .flex.grow.flex-col.gap-1.overflow-hidden
        RouterLink.link-hover.w-max.font-semibold.leading-none(
          :to="'/story/' + story.id"
        )
          | {{ story.name || story.collection.ref.value?.name + " with " + story.characters.map((c) => c.ref.value?.name).join(", ") }}
        .flex.items-center.gap-1(v-if="story.latestContent")
          img.aspect-square.h-5.shrink-0.rounded.border.bg-base-50.object-cover(
            v-if="story.latestContent.character.ref.value"
            :src="story.latestContent.character.ref.value.imagePreviewUrl.toString()"
          )
          p.w-full.whitespace-nowrap.text-sm.font-medium.leading-none.text-base-500
            | {{ story.latestContent.content }}

      .flex.shrink-0.flex-col.items-end
        RouterLink.btn.btn-square.border(:to="'/story/' + story.id") ➡️
</template>
