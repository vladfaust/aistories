<script setup lang="ts">
/// <reference types="vite-svg-loader" />
import DiscordLogo from "@/assets/discord.svg?component";
import MetamaskLogo from "@/assets/metamask.svg?component";
import config from "@/config";
import * as api from "@/services/api";
import * as eth from "@/services/eth";
import { jwt, userId } from "@/store";
import Web3Token from "web3-token";
import { useRouter } from "vue-router";
import * as auth from "@/services/auth";

const router = useRouter();

// Redirect to the main page if the user is already logged in.
if (userId.value) router.push("/");

async function logInMetamask() {
  if (!eth.provider.value) await eth.connect();

  const signer = eth.provider.value!.getSigner();

  const signOpts = {
    domain: import.meta.env.PROD ? config.trpcHttpUrl.hostname : undefined,
    expires_in: 60 * 60 * 1 * 1000, // 1 hour
    chain_id: (await eth.provider.value!.getNetwork()).chainId,
  };

  const web3Token = await Web3Token.sign(
    async (msg: string) => await signer.signMessage(msg),
    signOpts
  );

  jwt.value = (
    await api.commands.user.web3LogIn.mutate({
      web3Token,
    })
  ).jwt;

  // Set cookies.
  // TODO: Proper expiration (extract from jwt).
  document.cookie = `jwt=${jwt.value}; path=/; max-age=${60 * 60 * 24 * 1000}`;

  api.recreateWSClient();

  // Redirect to the main page.
  router.push("/");
}
</script>

<template lang="pug">
.flex.w-full.max-w-xs.flex-col.gap-2.place-self-center.rounded.border.p-4
  .flex.flex-col.gap-2
    a.btn.gap-2.text-white(
      class="bg-[#5865F2]"
      :href="auth.url(auth.Provider.Discord)"
    )
      | Log in with Discord
      DiscordLogo.h-5.fill-white
    button.btn.gap-2.text-white(class="bg-[#E8831D]" @click="logInMetamask")
      | Log in with Metamask
      MetamaskLogo.h-5.fill-white
  //- span.text-center.text-sm.uppercase.text-base-400 Or
  //- .flex.flex-col.gap-2
  //-   input.rounded.border.py-2.px-3(type="text" placeholder="E-mail")
  //-   input.rounded.border.py-2.px-3(type="password" placeholder="Password")
  //-   button.btn.btn-primary Log in with e-mail
  span.text-center.text-sm.uppercase.text-base-400 Or
  RouterLink.btn.w-full(to="/signup") Sign up
</template>
