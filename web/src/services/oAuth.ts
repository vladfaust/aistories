import config from "@/config";
import { nanoid } from "nanoid";

export enum Provider {
  Discord = "discord",
}

export function url(provider: Provider, scope: string[]): string {
  const state = nanoid();

  switch (provider) {
    case Provider.Discord:
      const url = new URL("https://discord.com/oauth2/authorize");
      url.searchParams.append("response_type", "code");
      url.searchParams.append("client_id", config.discordClientId);
      url.searchParams.append("scope", scope.join(" "));
      url.searchParams.append("state", state);
      url.searchParams.append("redirect_uri", config.discordRedirectUri);
      url.searchParams.append("prompt", "none");
      return url.toString();
  }
}
