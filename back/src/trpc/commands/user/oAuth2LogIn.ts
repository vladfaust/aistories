import { t } from "@/trpc/index";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import config from "@/config";
import * as jose from "jose";
import konsole from "@/services/konsole";
import pRetry from "p-retry";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      provider: z.enum(["discord"]),
      code: z.string(),
      state: z.string(),
    })
  )
  .output(z.object({ jwt: z.string() }))
  .mutation(async ({ input }) => {
    let url: string, data: FormData;

    switch (input.provider) {
      case "discord": {
        const provider = await prisma.oAuth2Provider.findUniqueOrThrow({
          where: { id: "discord" },
        });

        url = `https://discord.com/api/v10/oauth2/token`;

        data = new FormData();
        data.append("client_id", provider.clientId);
        data.append("client_secret", config.discord.clientSecret);
        data.append("grant_type", "authorization_code");
        data.append("code", input.code);
        data.append("redirect_uri", provider.redirectUri);
        data.append("state", input.state);

        break;
      }
    }

    konsole.log(["oauth", input.provider], "/token request...", {
      url,
      data: [...data],
    });
    const response = (await pRetry(() =>
      fetch(url, {
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
            Provider: {
              connect: {
                id: input.provider,
              },
            },
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

    // XXX: Issuer, audience, etc.
    const jwt = await new jose.SignJWT({ uid: identity.userId })
      .setProtectedHeader({
        alg: "HS256",
      })
      .sign(config.jwt.secret);

    return { jwt };
  });
