import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/dist/adapters/express";
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
  const { userId } = cookies;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid user",
      });
    }

    return { user };
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
