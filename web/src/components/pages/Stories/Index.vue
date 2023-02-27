<script setup lang="ts">
import { trpc } from "@/services/api";
import { ref, type ShallowRef, watchEffect, onUnmounted } from "vue";
import * as web3Auth from "@/services/web3Auth";
import { account } from "@/services/eth";
import Story from "@/models/Story";
import { useRouter } from "vue-router";
import { ArrowRightCircleIcon } from "@heroicons/vue/24/outline";

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
  .flex.w-full.max-w-3xl.flex-col.items-center.gap-6.py-8
    h1.text-2xl.font-extrabold.uppercase.leading-none.tracking-wider Stories
    RouterLink.btn.btn-primary(to="/stories/new") Embark a new story

    .flex.w-full.flex-col.gap-3.rounded-lg
      .flex.w-full.items-center.justify-between.gap-2.rounded-lg.border.p-3(
        v-for="story in stories"
      )
        .flex.w-full.items-center.gap-2.overflow-hidden
          .flex.shrink-0.pl-6
            template(v-for="character in story.characters.slice().reverse()")
              img.-ml-6.h-12.w-12.rounded-full.border.bg-base-50.object-cover(
                v-if="character.ref.value"
                :src="character.ref.value.imagePreviewUrl.toString()"
              )

          .flex.flex-col.overflow-hidden
            span.font-semibold.leading-tight {{ story.name || "Story with " + story.characters.map((c) => c.ref.value?.name).join(", ") }}
            .flex.gap-1(v-if="story.latestContent")
              img.h-6.w-6.rounded-full.border.bg-base-50.object-cover(
                v-if="story.latestContent.character.ref.value"
                :src="story.latestContent.character.ref.value.imagePreviewUrl.toString()"
              )
              p.whitespace-nowrap.text-sm.text-base-600 {{ story.latestContent.content }}

        .flex.shrink-0.flex-col.items-end
          RouterLink.btn.btn-primary.btn-square(:to="'/stories/' + story.id")
            ArrowRightCircleIcon.h-6.w-6
</template>
