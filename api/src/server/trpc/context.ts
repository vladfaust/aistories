import { PrismaClient } from "@prisma/client";
import config from "@/config";
import { TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/dist/adapters/express";
import * as jose from "jose";
import cookie from "cookie";
import { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

const prisma = new PrismaClient();

export type Context = {
  user: {
    id: string;
  } | null;
};

async function createContext(
  cookies: Record<string, string>
): Promise<Context> {
  const { jwt } = cookies;

  if (jwt) {
    try {
      const { payload } = await jose.jwtVerify(jwt, config.jwt.secret);

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: payload.uid as string },
        select: { id: true },
      });

      return { user };
    } catch (e) {
      if (e instanceof jose.errors.JOSEError) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: e.message });
      } else {
        throw e;
      }
    }
  } else {
    return { user: null };
  }
}

export async function createExpressContext({
  req,
}: CreateExpressContextOptions): Promise<Context> {
  if (req.cookies) {
    return await createContext(req.cookies);
  } else {
    return { user: null };
  }
}

export async function createWsContext({
  req,
  res,
}: CreateWSSContextFnOptions): Promise<Context> {
  const cookies = cookie.parse(req.headers.cookie ?? "");

  if (cookies) {
    return await createContext(cookies);
  } else {
    return { user: null };
  }
}
