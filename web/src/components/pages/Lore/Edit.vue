<script setup lang="ts">
import { useFileDialog } from "@vueuse/core";
import { computed, onMounted, onUnmounted, ref } from "vue";
import prettyBytes from "pretty-bytes";
import { trpc } from "@/services/api";
import Spinner2 from "@/components/utility/Spinner2.vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { Deferred } from "@/utils/deferred";
import Lore from "@/models/Lore";
import { notify } from "@kyvg/vue3-notification";
import Toggle from "@/components/utility/Toggle.vue";
import { tokenize } from "@/utils/ai";
import nProgress from "nprogress";

const IMAGE_MAX_SIZE = 1000 * 1000; // 1 MB
const NAME_MAX_LENGTH = 32;
const ABOUT_MAX_LENGTH = 512;
const PROMPT_MAX_TOKEN_LENGTH = 512;

const router = useRouter();

const { lore } = defineProps<{ lore?: Deferred<Lore | null> }>();

if (lore) {
  await lore.promise;
}

nProgress.done();

let justCreated = false;

const imageDialog = useFileDialog({
  accept: "image/*",
  multiple: false,
});

const imageFile = computed(() => imageDialog.files.value?.[0]);
const imageUrl = computed(() =>
  imageFile.value
    ? URL.createObjectURL(imageFile.value)
    : lore?.ref.value?.imageUrl?.toString()
);
const imageSize = computed(() => imageFile.value?.size);
const imageSizeLimitExceeded = computed(
  () => imageSize.value && imageSize.value > IMAGE_MAX_SIZE
);

const name = ref(lore?.ref.value?.name.value || "");
const nameLength = computed(() => name.value.length);
const nameLengthLimitExceeded = computed(
  () => nameLength.value > NAME_MAX_LENGTH
);

const about = ref(lore?.ref.value?.about.value || "");
const aboutLength = computed(() => about.value.length);
const aboutLengthLimitExceeded = computed(
  () => aboutLength.value > ABOUT_MAX_LENGTH
);

const prompt = ref(lore?.ref.value?.prompt?.value || "");
const promptTokenLength = computed(() => tokenize(prompt.value).bpe.length);
const promptTokenLengthLimitExceeded = computed(
  () => promptTokenLength.value > PROMPT_MAX_TOKEN_LENGTH
);

const public_ = ref(
  lore?.ref.value?.public_.value !== undefined
    ? lore?.ref.value?.public_.value
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
      prompt.value.length > 0 &&
      !promptTokenLengthLimitExceeded.value
    )
);

/**
 * Returns false if there is no existing lore, or if there are any changes.
 */
const anyChanges = computed(
  () =>
    !!(
      imageFile.value ||
      (public_.value && public_.value !== lore?.ref.value?.public_.value) ||
      (name.value && name.value !== lore?.ref.value?.name.value) ||
      (about.value && about.value !== lore?.ref.value?.about.value) ||
      (prompt.value && prompt.value !== lore?.ref.value?.prompt?.value)
    )
);

const inProgress = ref(false);

async function create() {
  if (!valid.value) return;
  if (inProgress.value) return;

  inProgress.value = true;

  try {
    const lore = await trpc.commands.lores.create.mutate({
      public: public_.value,
      name: name.value,
      about: about.value,
      prompt: prompt.value,
    });
    console.log("Created lore", lore);

    const { uploadUrl: imageUploadUrl } =
      await trpc.commands.lores.getImageUploadUrl.query({
        loreId: lore.id,
      });

    console.log("Uploading image to ", imageUploadUrl);
    await fetch(imageUploadUrl, {
      method: "PUT",
      body: imageFile.value,
    });

    console.log("Image uploaded");

    notify({
      title: "Success!",
      text: "Lore created",
      type: "success",
    });

    justCreated = true;

    await router.push(`/lores/${lore.id}`);
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
  if (!lore?.ref.value) throw new Error("Unexpected null lore");

  inProgress.value = true;

  try {
    const promises = [];

    if (imageFile.value) {
      promises.push(
        (async () => {
          const { uploadUrl: imageUploadUrl } =
            await trpc.commands.lores.getImageUploadUrl.query({
              loreId: lore!.ref.value!.id,
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
      public_.value !== lore.ref.value.public_.value ||
      name.value !== lore.ref.value.name.value ||
      about.value !== lore.ref.value.about.value ||
      prompt.value !== lore.ref.value.prompt?.value
    ) {
      promises.push(
        (async () => {
          await trpc.commands.lores.update.mutate({
            loreId: lore!.ref.value!.id,
            public: public_.value || undefined,
            name: name.value || undefined,
            about: about.value || undefined,
            prompt: prompt.value || undefined,
          });

          console.log("Updated lore");

          lore.ref.value!.public_.value = public_.value;
          lore.ref.value!.name.value = name.value;
          lore.ref.value!.about.value = about.value;
          lore.ref.value!.prompt!.value = prompt.value;
        })()
      );
    }

    await Promise.all(promises);

    notify({
      title: "Success!",
      text: "Lore updated",
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
.flex.w-full.max-w-3xl.flex-col.gap-2
  .flex.items-center.justify-between.gap-3
    h2.shrink-0.text-xl.font-medium {{ lore ? "Edit" : "Create" }} lore
    template(v-if="lore")
      .w-full.bg-base-100(class="h-[1px]")
      RouterLink.link-hover.shrink-0.text-base-400(
        :to="'/lores/' + lore.ref.value?.id"
        title="Return to the lore"
      )
        span #
        span {{ lore.ref.value?.id }}

  .flex.flex-col.gap-2
    .grid.gap-3.sm_grid-cols-3
      .flex.items-center.justify-between.gap-3.sm_col-span-3
        label.shrink-0.font-medium
          | Image
          span(
            v-if="lore?.ref.value && imageUrl !== lore.ref.value.imageUrl.toString()"
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
        button.h-full.w-full.bg-base-50(
          type="button"
          @click="() => imageDialog.open()"
          v-else
        ) Open file

      .flex.flex-col.gap-2.sm_col-span-2
        .flex.items-center.justify-between.gap-3
          label.shrink-0.font-medium
            | Name
            span(v-if="lore?.ref.value && name !== lore.ref.value.name.value") *
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
              v-if="lore?.ref.value && about !== lore.ref.value.about.value"
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
        | Prompt (hidden)
        span(v-if="lore?.ref.value && prompt !== lore.ref.value.prompt?.value") *
      .w-full.bg-base-100(class="h-[1px]")
      span.shrink-0.text-base-500(
        :class="{ 'text-error-500': promptTokenLengthLimitExceeded }"
      )
        | {{ promptTokenLength }} / {{ PROMPT_MAX_TOKEN_LENGTH }}
        |
        a.link(href="https://platform.openai.com/tokenizer" tabindex="-1") tokens
    textarea.rounded.border.px-3.py-2.text-sm.leading-tight(
      type="text"
      placeholder="Prompt"
      v-model="prompt"
      :class="{ 'border-error-500': promptTokenLengthLimitExceeded }"
      rows=8
    )

    p.rounded.border.bg-base-50.p-2.text-xs.leading-tight.text-base-500
      | The lore prompt is inserted into each story prompt.
      | It is never shown to the user.
      | Experiment with different prompts to see what works best for the lore.

    .flex.items-center.justify-between.gap-3
      label.shrink-0.font-medium
        | Public
        span(
          v-if="lore?.ref.value && public_ !== lore.ref.value.public_.value"
        ) *
      .w-full.bg-base-100(class="h-[1px]")
      Toggle.shrink-0(
        v-model="public_"
        :disabled="lore?.ref.value?.public_.value || inProgress"
      )

    p.rounded.border.bg-base-50.p-2.text-xs.leading-tight.text-base-500
      | Public lores are visible to everyone.
      | Once a lore is public, it cannot be made private again.
      | The prompt is always hidden, even if the lore is public.

    button.btn.btn-primary.mt-1(
      v-if="lore"
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
