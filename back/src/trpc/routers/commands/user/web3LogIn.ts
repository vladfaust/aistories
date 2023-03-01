import { t } from "@/trpc/index";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import Web3Token from "web3-token";
import config from "@/config";
import { toBuffer } from "@/utils";
import * as jose from "jose";
import konsole from "@/services/konsole";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ web3Token: z.string() }))
  .output(z.object({ jwt: z.string() }))
  .mutation(async ({ input }) => {
    const { address: addressString } = Web3Token.verify(input.web3Token, {
      domain: config.prod ? config.httpServer.host : undefined,
    });

    const address = toBuffer(addressString);

    const identity = await prisma.$transaction(async (prisma) => {
      let identity = await prisma.web3Identity.findUnique({
        where: { address },
        select: { userId: true },
      });

      if (!identity) {
        konsole.log(["web3LogIn"], "Creating new identity", {
          address: addressString,
        });

        identity = await prisma.web3Identity.create({
          data: {
            User: {
              create: {},
            },
            address,
          },
          select: { userId: true },
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
