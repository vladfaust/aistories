import { IncomingMessage } from "http";
import Web3Token from "web3-token";
import { ethers } from "ethers";
import { PrismaClient, User } from "@prisma/client";
import config from "@/config";
import { inferAsyncReturnType } from "@trpc/server";
import { WebSocket } from "ws";

const prisma = new PrismaClient();

function verifyWeb3Token(token: string) {
  return Web3Token.verify(token, {
    domain: config.prod ? config.server.host : undefined,
  });
}

/**
 * May be used explicitly.
 *
 * @param web3Token
 * @returns Upserted user
 */
export async function upsertUser(web3Token: string): Promise<User> {
  const { address } = verifyWeb3Token(web3Token);
  const evmAddress = Buffer.from(ethers.utils.arrayify(address));

  return await prisma.user.upsert({
    where: {
      evmAddress,
    },
    update: {},
    create: {
      evmAddress,
    },
  });
}

async function getAuthFromHeader(header: string): Promise<User | null> {
  const raw = header.match(/^Web3-Token\s+([\w=]+)$/)?.[1];

  if (raw) {
    return await upsertUser(raw);
  } else {
    return null;
  }
}

export async function createContext({
  req,
  res,
}: {
  req: IncomingMessage;
  res: WebSocket;
}) {
  return {
    auth: req.headers.authorization
      ? await getAuthFromHeader(req.headers.authorization)
      : null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
