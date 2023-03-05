import config from "@/config";
import konsole from "@/services/konsole";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { nanoid } from "nanoid";
import pRetry from "p-retry";
import z from "zod";

const prisma = new PrismaClient();

export default async function (req: Request, res: Response) {
  const input = z
    .object({
      provider: z.enum(["discord"]),
      code: z.string(),
      state: z.string(),
    })
    .parse({
      provider: req.params.provider,
      code: req.query.code as string,
      state: req.query.state as string,
    });

  const data = new FormData();
  data.append("client_id", config.discord.clientId);
  data.append("client_secret", config.discord.clientSecret);
  data.append("grant_type", "authorization_code");
  data.append("code", input.code);
  data.append("redirect_uri", config.discord.redirectUri);
  data.append("state", input.state);

  konsole.log(["oauth", input.provider], "/token request...", {
    url: `https://discord.com/api/v10/oauth2/token`,
    data: [...data],
  });
  const response = (await pRetry(() =>
    fetch(`https://discord.com/api/v10/oauth2/token`, {
      method: "POST",
      body: data,
    }).then((r) => r.json())
  )) satisfies {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
  console.debug(response);

  konsole.log(["oauth", input.provider], "/@me request...");
  const me = await pRetry(() =>
    fetch("https://discord.com/api/v10/oauth2/@me", {
      headers: {
        Authorization: `${response.token_type} ${response.access_token}`,
      },
    })
  ).then((r) => r.json());
  console.debug(me);

  const id = me.user?.id;
  konsole.log(["oauth", input.provider], "/@me response", { id });

  const identity = await prisma.$transaction(async (prisma) => {
    let identity = await prisma.oAuth2Identity.findFirst({
      where: {
        providerId: input.provider,
        externalId: id,
      },
      select: {
        userId: true,
      },
    });

    if (!identity) {
      identity = await prisma.oAuth2Identity.create({
        data: {
          providerId: input.provider,
          User: { create: { id: nanoid() } },
          externalId: id,
          accessToken: response.access_token,
          tokenType: response.token_type,
          scope: response.scope,
          expiresAt: new Date(
            new Date().valueOf() + response.expires_in * 1000
          ),
          refreshToken: response.refresh_token,
        },
        select: {
          userId: true,
        },
      });
    }

    return identity;
  });

  // Set userId cookie
  res.cookie("userId", identity.userId, {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
  });

  res.redirect(config.server.corsOrigin);
}
