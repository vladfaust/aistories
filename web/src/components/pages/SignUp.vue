<script setup lang="ts">
/// <reference types="vite-svg-loader" />
import DiscordLogo from "@/assets/discord.svg?component";
import MetamaskLogo from "@/assets/metamask.svg?component";
import * as auth from "@/services/auth";
</script>

<template lang="pug">
.flex.w-full.max-w-xs.flex-col.gap-2.place-self-center.rounded.border.p-4
  .flex.flex-col.gap-2
    a.btn.gap-2.text-white(
      class="bg-[#5865F2]"
      :href="auth.url(auth.Provider.Discord)"
    )
      | Sign up with Discord
      DiscordLogo.h-5.fill-white
    button.btn.gap-2.text-white(class="bg-[#E8831D]")
      | Sign up with Metamask
      MetamaskLogo.h-5.fill-white
  span.text-center.text-sm.uppercase.text-base-400 Or
  //- .flex.flex-col.gap-2
  //-   input.rounded.border.py-2.px-3(type="text" placeholder="E-mail")
  //-   input.rounded.border.py-2.px-3(type="password" placeholder="Password")
  //-   input.rounded.border.py-2.px-3(
  //-     type="password"
  //-     placeholder="Confirm Password"
  //-   )
  //-   .flex.gap-2
  //-     input#terms(type="checkbox")
  //-     label(for="terms")
  //-       | I agree to&nbsp;
  //-       RouterLink.link.text-primary-500(to="/legal") the terms
  //-       | .
  //-   button.btn.btn-primary Sign up with e-mail
  //- span.text-center.text-sm.uppercase.text-base-400 Or
  RouterLink.btn.w-full(to="/login") Log in
</template>
