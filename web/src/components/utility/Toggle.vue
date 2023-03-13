<script setup lang="ts">
const { modelValue, disabled } = defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="relative inline-flex cursor-pointer items-center">
    <input
      type="checkbox"
      class="peer sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    />
    <div
      class="peer h-6 w-11 rounded-full bg-gray-200 after_absolute after_top-[2px] after_left-[2px] after_h-5 after_w-5 after_rounded-full after_border after_border-gray-300 after_bg-white after_transition-all after_content-[''] peer-checked_bg-blue-600 peer-checked_after_translate-x-full peer-checked_after_border-white peer-focus_outline-none peer-focus_ring-4 peer-focus_ring-blue-300 dark_border-gray-600 dark_bg-gray-700 dark_peer-focus_ring-blue-800"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    ></div>
  </label>
</template>
