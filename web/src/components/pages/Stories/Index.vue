<script setup lang="ts">
import { trpc } from "@/services/api";
import { ref, type ShallowRef, watchEffect, onUnmounted } from "vue";
import * as web3Auth from "@/services/web3Auth";
import { account } from "@/services/eth";
import Story from "@/models/Story";
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
      Story.fromBackendModel({
        ...data,
        userMap: JSON.parse(data.userMap) as Record<number, number>,
      })
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
  .flex.w-full.max-w-3xl.flex-col.items-center.gap-3
    p.bg-nft.bg-x2.w-full.animate-bg-position.rounded.p-8.text-center.leading-none.text-white.shadow
      span.text-3xl.font-medium
        span ai
        span.font-semibold stories
        span .xyz
        span.select-none ™️
        sup.select-none.text-white.text-opacity-50(title="beta") (β)
      br
      span.text-lg
        | is&nbsp;
        i the
        | &nbsp;place to relive infinite stories in the company of AI.
      br
      span.text-2xl ❤️💀🤖

    RouterLink.btn.btn-primary.w-full(to="/new") Embark new story ✨

    .flex.w-full.flex-col.gap-2(v-if="stories.length > 0")
      .flex.w-full.items-center.justify-between.gap-2.rounded.border.p-3(
        v-for="story in stories"
      )
        .flex.shrink-0.pl-6
          template(v-for="character in story.characters.slice().reverse()")
            img.-ml-6.box-content.h-10.w-10.rounded-full.border.bg-base-50.object-cover(
              v-if="character.ref.value"
              :src="character.ref.value.imagePreviewUrl.toString()"
            )

        .flex.grow.flex-col.gap-1.overflow-hidden
          RouterLink.link-hover.w-max.font-semibold.leading-none(
            :to="'/' + story.id"
          )
            | {{ story.name || "Story with " + story.characters.map((c) => c.ref.value?.name).join(", ") }}
          .flex.items-center.gap-1(v-if="story.latestContent")
            img.aspect-square.h-5.shrink-0.rounded.border.bg-base-50.object-cover(
              v-if="story.latestContent.character.ref.value"
              :src="story.latestContent.character.ref.value.imagePreviewUrl.toString()"
            )
            p.w-full.whitespace-nowrap.text-sm.font-medium.leading-none.text-base-500
              | {{ story.latestContent.content }}

        .flex.shrink-0.flex-col.items-end
          RouterLink.btn.btn-square.border(:to="'/' + story.id") ➡️
</template>
