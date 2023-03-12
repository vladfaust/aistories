import config from "@/config";

if (config.prod) {
  throw new Error("This script is not for production");
}

import { PrismaClient } from "@prisma/client";
import { GRANT_SETTING as DISCORD_GRANT_SETTING } from "#trpc/commands/me/energy/claimDiscord";

const prisma = new PrismaClient();

async function settings() {
  async function set(key: string, value: string, description: string) {
    await prisma.settings.create({
      data: {
        key,
        value,
        description,
      },
    });
  }

  await set(
    "twitterLink",
    "https://twitter.com/elonmusk",
    "Link to the Twitter account"
  );

  await set(
    "discordLink",
    "https://discord.gg/tUKJTvGX",
    "Link to the Discord server"
  );

  await set(
    "energyWeb3ExchangeRate",
    "50",
    "How much energy you get for 1 ETH"
  );

  await set(
    "energyWeb3ExchangeMinValue",
    "1",
    "Minimum amount of ETH to exchange for energy"
  );

  await set(
    DISCORD_GRANT_SETTING,
    "50",
    "Amount of energy to grant for being a member of the Discord guild"
  );
}

async function main() {
  await settings();
}

await main();
process.exit(0);
