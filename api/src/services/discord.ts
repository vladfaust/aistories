import config from "@/config";

export async function getMeGuildMember(
  tokenType: string,
  token: string
): Promise<{
  user: { id: string } | null;
}> {
  const response = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${config.discord.guildId}/member`,
    { headers: { Authorization: `${tokenType} ${token}` } }
  );

  if (response.status === 404) {
    return { user: null }; // User is not in guild
  } else if (!response.ok) {
    throw new Error(
      `Failed to get guild member (${response.status}): ${response.statusText}`,
      { cause: response }
    );
  }

  return await response.json();
}

export async function me(
  tokenType: string,
  token: string
): Promise<{
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}> {
  const response = await fetch(`https://discord.com/api/v10/users/@me`, {
    headers: { Authorization: `${tokenType} ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get Discord user (${response.status}): ${response.statusText}`,
      { cause: response }
    );
  }

  return await response.json();
}
