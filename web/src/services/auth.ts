import config from "@/config";
import { nanoid } from "nanoid";

export enum Provider {
  Discord = "discord",
}

export function url(provider: Provider): string {
  const state = setRandomState(provider);

  switch (provider) {
    case Provider.Discord:
      const url = new URL("https://discord.com/oauth2/authorize");
      url.searchParams.append("response_type", "code");
      url.searchParams.append("client_id", config.discordClientId);
      url.searchParams.append("scope", "identify");
      url.searchParams.append("state", state);
      url.searchParams.append("redirect_uri", config.discordRedirectUri);
      url.searchParams.append("prompt", "none");
      return url.toString();
  }
}

export function setRandomState(provider: Provider): string {
  const state = nanoid();
  sessionStorage.setItem(`authState:${provider}`, state);
  return state;
}

export function getState(provider: Provider): string | null {
  return sessionStorage.getItem(`authState:${provider}`);
}

export function cleanup() {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("authState:")) {
      sessionStorage.removeItem(key);
    }
  }
}
