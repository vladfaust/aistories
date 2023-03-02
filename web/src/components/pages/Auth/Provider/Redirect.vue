<script setup lang="ts">
import * as auth from "@/services/auth";
import { onMounted } from "vue";
import * as api from "@/services/api";
import { useRoute, useRouter } from "vue-router";
import { jwt } from "@/store";
import Spinner2 from "@/components/utility/Spinner2.vue";

const route = useRoute();
const router = useRouter();

const { provider } = defineProps<{
  provider: auth.Provider;
}>();

onMounted(async () => {
  jwt.value = (
    await api.commands.user.oAuth2LogIn.mutate({
      provider,
      code: route.query.code as string,
      state: route.query.state as string,
    })
  ).jwt;

  // Set cookies.
  // TODO: Proper expiration (extract from jwt).
  document.cookie = `jwt=${jwt.value}; path=/; max-age=${60 * 60 * 24 * 1000}`;

  api.recreateWSClient();

  // Redirect to the main page.
  router.push("/");
});
</script>

<template lang="pug">
Spinner2.h-5.animate-spin
</template>
