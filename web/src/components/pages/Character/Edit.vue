<script setup lang="ts">
import { useFileDialog } from "@vueuse/core";
import { computed, onMounted, onUnmounted, ref } from "vue";
import GPT3Tokenizer from "gpt3-tokenizer";
import prettyBytes from "pretty-bytes";
import { trpc } from "@/services/api";
import Spinner2 from "@/components/utility/Spinner2.vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { Deferred } from "@/utils/deferred";
import Character from "@/models/Character";
import Lore from "@/models/Lore";
import LoreSummary from "@/components/Lore/Summary.vue";
import LoreCard from "@/components/Lore/Card.vue";
import { notify } from "@kyvg/vue3-notification";
import Toggle from "@/components/utility/Toggle.vue";

const IMAGE_MAX_SIZE = 1000 * 1000; // 1 MB
const NAME_MAX_LENGTH = 32;
const ABOUT_MAX_LENGTH = 512;
const PROMPT_MAX_TOKEN_LENGTH = 512;

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
const router = useRouter();

let { lore, char } = defineProps<{
  lore: Deferred<Lore | null>;
  char?: Deferred<Character | null>;
}>();

await Promise.all([lore.promise, char ? char.promise : Promise.resolve()]);

let justCreated = false;

const imageDialog = useFileDialog({
  accept: "image/*",
  multiple: false,
});

const imageFile = computed(() => imageDialog.files.value?.[0]);
const imageUrl = computed(() =>
  imageFile.value
    ? URL.createObjectURL(imageFile.value)
    : char?.ref.value?.imageUrl.toString()
);
const imageSize = computed(() => imageFile.value?.size);
const imageSizeLimitExceeded = computed(
  () => imageSize.value && imageSize.value > IMAGE_MAX_SIZE
);

const name = ref(char?.ref.value?.name.value || "");
const nameLength = computed(() => name.value.length);
const nameLengthLimitExceeded = computed(
  () => nameLength.value > NAME_MAX_LENGTH
);

const about = ref(char?.ref.value?.about.value || "");
const aboutLength = computed(() => about.value.length);
const aboutLengthLimitExceeded = computed(
  () => aboutLength.value > ABOUT_MAX_LENGTH
);

const personality = ref(char?.ref.value?.personality!.value || "");
const personalityTokenLength = computed(
  () => tokenizer.encode(personality.value).bpe.length
);
const personalityTokenLengthLimitExceeded = computed(
  () => personalityTokenLength.value > PROMPT_MAX_TOKEN_LENGTH
);

const public_ = ref(
  char?.ref.value?.public_.value !== undefined
    ? char?.ref.value?.public_.value
    : false
);

const valid = computed(
  () =>
    !!(
      imageUrl.value &&
      imageUrl.value.length > 0 &&
      name.value.length > 0 &&
      !nameLengthLimitExceeded.value &&
      about.value.length > 0 &&
      !aboutLengthLimitExceeded.value &&
      personality.value.length > 0 &&
      !personalityTokenLengthLimitExceeded.value
    )
);

const anyChanges = computed(
  () =>
    !!(
      imageFile.value ||
      (name.value && name.value !== char?.ref.value?.name.value) ||
      (about.value && about.value !== char?.ref.value?.about.value) ||
      (personality.value &&
        personality.value !== char?.ref.value?.personality?.value) ||
      public_.value !== char?.ref.value?.public_.value
    )
);

const inProgress = ref(false);

async function create() {
  if (!valid.value) return;
  if (inProgress.value) return;

  inProgress.value = true;

  try {
    const char = await trpc.commands.characters.create.mutate({
      loreId: lore!.ref.value!.id,
      public: public_.value,
      name: name.value,
      about: about.value,
      personality: personality.value,
    });
    console.log("Created char", char);

    const { uploadUrl: imageUploadUrl } =
      await trpc.commands.characters.getImageUploadUrl.query({
        charId: char.charId,
      });

    console.log("Uploading image to ", imageUploadUrl);
    await fetch(imageUploadUrl, {
      method: "PUT",
      body: imageFile.value,
    });

    console.log("Image uploaded");

    notify({
      title: "Success!",
      text: "Character created",
      type: "success",
    });

    justCreated = true;

    router.push(`/chars/${char.charId}`);
  } catch (e: any) {
    console.error(e);
    alert(e.message);
  } finally {
    inProgress.value = false;
  }
}

async function update() {
  if (!anyChanges.value) return;
  if (!valid.value) return;
  if (inProgress.value) return;
  if (!char?.ref.value) throw new Error("Unexpected null char");

  inProgress.value = true;

  try {
    const promises = [];

    if (imageFile.value) {
      promises.push(
        (async () => {
          const { uploadUrl: imageUploadUrl } =
            await trpc.commands.characters.getImageUploadUrl.query({
              charId: char!.ref.value!.id,
            });

          console.log("Uploading image to ", imageUploadUrl);
          await fetch(imageUploadUrl, {
            method: "PUT",
            body: imageFile.value,
          });

          console.log("Image uploaded");
          imageDialog.reset();
        })()
      );
    }

    if (
      name.value !== char.ref.value.name.value ||
      about.value !== char.ref.value.about.value ||
      personality.value !== char.ref.value.personality?.value ||
      public_.value !== char.ref.value.public_.value
    ) {
      promises.push(
        (async () => {
          await trpc.commands.characters.update.mutate({
            charId: char!.ref.value!.id,
            public: public_.value,
            name: name.value || undefined,
            about: about.value || undefined,
            personality: personality.value || undefined,
          });

          console.log("Updated character");

          char.ref.value!.name.value = name.value;
          char.ref.value!.about.value = about.value;
          char.ref.value!.personality!.value = personality.value;
          char.ref.value!.public_.value = public_.value;
        })()
      );
    }

    await Promise.all(promises);

    notify({
      title: "Success!",
      text: "Character updated",
      type: "success",
    });
  } catch (e: any) {
    console.error(e);
    alert(e.message);
  } finally {
    inProgress.value = false;
  }
}

function mayLeave(): boolean {
  let answer = true;

  if (!justCreated && (anyChanges.value || inProgress.value)) {
    answer = window.confirm(
      "Do you really want to leave? All uncomitted data will be lost."
    );
  }

  return answer;
}

onBeforeRouteLeave((to, from, next) => {
  next(mayLeave());
});

function beforeunload(e: BeforeUnloadEvent) {
  if (!mayLeave()) {
    e.preventDefault();

    // Chrome requires returnValue to be set
    e.returnValue = "";
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", beforeunload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", beforeunload);
});
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  .flex.items-center.justify-between.gap-3
    h2.shrink-0.text-xl.font-medium {{ char ? "Edit" : "Create" }} character
    template(v-if="char")
      .w-full.bg-base-100(class="h-[1px]")
      RouterLink.link-hover.shrink-0.text-base-400(
        :to="'/chars/' + char.ref.value?.id"
        title="Return to the character"
      )
        span #
        span {{ char.ref.value?.id }}

  .flex.flex-col.gap-2
    h3.font-medium Lore
    .grid.gap-3.sm_grid-cols-4(v-if="lore?.ref.value")
      LoreCard.gap-2.rounded.border.p-2(:lore="lore.ref.value")
      LoreSummary.hidden.sm_col-span-3.sm_block(:lore="lore.ref.value")

    .grid.gap-3.sm_grid-cols-3
      .flex.items-center.justify-between.gap-3.sm_col-span-3
        label.shrink-0.font-medium
          | Image
          span(
            v-if="char?.ref.value && imageUrl !== char.ref.value.imageUrl.toString()"
          ) *
        .w-full.bg-base-100(class="h-[1px]")
        span.shrink-0.text-base-500(
          :class="{ 'text-error-500': imageSizeLimitExceeded }"
        ) {{ imageSize ? prettyBytes(imageSize) : "0" }} / {{ prettyBytes(IMAGE_MAX_SIZE) }}

      .aspect-square.overflow-hidden.rounded.border
        img.h-full.w-full.cursor-pointer.object-cover.transition-transform.hover_scale-105(
          :src="imageUrl"
          v-if="imageUrl"
          @click="() => imageDialog.open()"
        )
        button.h-full.w-full.text-gray-400(
          type="button"
          @click="() => imageDialog.open()"
          v-else
        ) Open file

      .flex.flex-col.gap-2.sm_col-span-2
        .flex.items-center.justify-between.gap-3
          label.shrink-0.font-medium
            | Name
            span(v-if="char?.ref.value && name !== char.ref.value.name.value") *
          .w-full.bg-base-100(class="h-[1px]")
          span.shrink-0.text-base-500(
            :class="{ 'text-error-500': nameLengthLimitExceeded }"
          ) {{ nameLength }} / {{ NAME_MAX_LENGTH }} chars
        input.rounded.border.px-3.py-2(
          type="text"
          placeholder="Name"
          v-model="name"
          :class="{ 'border-error-500': nameLengthLimitExceeded }"
        )

        .flex.items-center.justify-between.gap-3
          label.shrink-0.font-medium
            | About (public)
            span(
              v-if="char?.ref.value && about !== char.ref.value.about.value"
            ) *
          .w-full.bg-base-100(class="h-[1px]")
          span.shrink-0.text-base-500(
            :class="{ 'text-error-500': aboutLengthLimitExceeded }"
          ) {{ aboutLength }} / {{ ABOUT_MAX_LENGTH }} chars
        textarea.h-full.rounded.border.px-3.py-2.text-sm.leading-tight(
          type="text"
          placeholder="About"
          v-model="about"
          maxlength=ABOUT_MAX_LENGTH
          :class="{ 'border-error-500': aboutLengthLimitExceeded }"
          rows=3
        )

    .flex.items-center.justify-between.gap-3
      label.shrink-0.font-medium
        | Personality (hidden)
        span(
          v-if="char?.ref.value && personality !== char.ref.value.personality?.value"
        ) *
      .w-full.bg-base-100(class="h-[1px]")
      span.shrink-0.text-base-500(
        :class="{ 'text-error-500': personalityTokenLengthLimitExceeded }"
      )
        | {{ personalityTokenLength }} / {{ PROMPT_MAX_TOKEN_LENGTH }}
        |
        a.link(href="https://platform.openai.com/tokenizer" tabindex="-1") tokens
    textarea.rounded.border.px-3.py-2.text-sm.leading-tight(
      type="text"
      placeholder="Personality prompt"
      v-model="personality"
      :class="{ 'border-error-500': personalityTokenLengthLimitExceeded }"
      rows=8
    )

    p.text-sm.leading-tight.text-base-500
      | A character personality is used as a hidden prompt for the AI.
      | It is not shown to the user.
      | Expereiment with different personalities to see what works best for the character.

    .-my-1.flex.items-center.justify-between.gap-3
      label.shrink-0.font-medium
        | Public
        span(
          v-if="char?.ref.value && public_ !== char.ref.value.public_.value"
        ) *
      .w-full.bg-base-100(class="h-[1px]")
      Toggle.shrink-0(
        v-model="public_"
        :disabled="char?.ref.value?.public_.value || inProgress"
      )

    p.text-sm.leading-tight.text-base-500
      | Public characters are visible to everyone.
      | Once a character is public, it cannot be made private again.
      | The personality is always hidden, even if the character is public.

    button.btn.btn-primary.mt-1(
      v-if="char"
      :disabled="!anyChanges || !valid || inProgress"
      @click="update"
    )
      Spinner2.h-5.animate-spin.text-white(v-if="inProgress")
      span(v-else) Update

    button.btn.btn-primary.mt-1(
      v-else
      :disabled="!valid || inProgress"
      @click="create"
    )
      Spinner2.h-5.animate-spin.text-white(v-if="inProgress")
      span(v-else) Create
</template>
