import * as offchainCafe from "@/services/offchainCafe";
import { gql } from "@urql/core";
import config from "@/config";
import receiverAbi from "~/abi/receiver.json" assert { type: "json" };
import { BigNumber, ethers } from "ethers";
import { Web3EnergyPurchase, PrismaClient } from "@prisma/client";
import { toBuffer, toHex } from "./utils";
import { pipe, subscribe } from "wonka";
import * as settings from "@/settings";
import pRetry from "p-retry";
import konsole from "./services/konsole";

const EXCHANGE_RATE = parseFloat(await settings.get("energyExchangeRate"));
const MIN_VALUE = parseFloat(await settings.get("energyExchangeMinValue"));

type Log = {
  block: {
    number: number;
    timestamp: number;
  };
  logIndex: number;
  transaction: {
    hash: string;
  };
  data: string;
  topics: string[];
};

const prisma = new PrismaClient();

async function logToEnergyPurchaseObject(
  log: Log
): Promise<Web3EnergyPurchase | null> {
  const amount = BigNumber.from(log.data);

  if (amount.lt(minAmount)) {
    console.log("Ignoring log with amount < MIN_VALUE");
    return null;
  }

  const address = toBuffer("0x" + log.topics[1].slice(26));

  // FIXME: Transaction fails on multiple concurrent requests,
  // so had to wrap it in a retry.
  const identity = await pRetry(() =>
    prisma.$transaction(async (prisma) => {
      let identity = await prisma.web3Identity.findUnique({
        where: { address },
        select: { address: true },
      });

      if (!identity) {
        const user = await prisma.user.create({
          data: {},
          select: { id: true },
        });

        identity = await prisma.web3Identity.create({
          data: {
            address,
            userId: user.id,
          },
          select: { address: true },
        });
      }

      return identity;
    })
  );

  const energy = amount
    .mul(EXCHANGE_RATE)
    .div(ethers.constants.WeiPerEther)
    .toNumber();

  const obj = {
    address: identity.address,
    blockNumber: log.block.number,
    logIndex: log.logIndex,
    txHash: toBuffer(log.transaction.hash),
    blockTime: new Date(log.block.timestamp * 1000),
    energy,
    value: toBuffer(amount._hex),
  };

  return obj;
}

const minAmount = ethers.utils.parseEther(MIN_VALUE.toString());
const iface = new ethers.utils.Interface(receiverAbi);
const receiveEventTopic = iface.getEventTopic("Receive");

const LATEST_BLOCK_GQL = gql`
  query {
    meta {
      chain {
        latestBlock {
          number
        }
      }
    }
  }
`;

const GET_LOGS_GQL = gql`
  query ContractLogs(
    $fromBlock: Int!,
    $toBlock: Int!
  ) {
    contract(address: "${config.receiverAddress}") {
      logs(
        topics: [["${receiveEventTopic}"]],
        limit: 100,
        fromBlock: $fromBlock,
        toBlock: $toBlock
      ) {
         block {
           number
           timestamp
         }
         logIndex
         transaction {
           hash
         }
         data
         topics
      }
    }
  }`;

const SUBSCRIBE_TO_LOGS_GQL = gql`
  subscription {
    log(
      contractAddress: "${config.receiverAddress}",
      topics: [["${receiveEventTopic}"]]
    ) {
      block {
        number
        timestamp
      }
      logIndex
      transaction {
        hash
      }
      data
      topics
    }
  }`;

let latestEnergyPurchaseBlock =
  (
    await prisma.web3EnergyPurchase.findFirst({
      orderBy: { blockNumber: "desc" },
      select: { blockNumber: true },
    })
  )?.blockNumber ?? 0;

const latestChainBlockNumber = (
  await offchainCafe.client.query(LATEST_BLOCK_GQL, {}).toPromise()
).data.meta.chain.latestBlock.number as number;

// Subscribe to new contract logs.
const { unsubscribe } = pipe(
  offchainCafe.client.subscription(SUBSCRIBE_TO_LOGS_GQL, {}),
  subscribe(async (result) => {
    const log: Log | undefined = result.data?.log;
    if (!log) throw new Error("No data received");

    const event = await logToEnergyPurchaseObject(log);
    if (event) {
      konsole.log(["Web3EnergyPurchase"], `New purchase! 🤑`, {
        address: toHex(event.address),
        value: ethers.utils.formatEther(event.value),
      });

      return prisma.web3EnergyPurchase.createMany({
        data: [event],
        skipDuplicates: true,
      });
    }
  })
);

let fromBlock = latestEnergyPurchaseBlock;
let logIndicesFromTheLatestBlock: number[] = [];

// Query for all contract logs from the latest block to the current block.
while (fromBlock < latestChainBlockNumber) {
  console.log(`Querying historical logs from block ${fromBlock}`);

  const logs: Log[] = (
    await offchainCafe.client
      .query(GET_LOGS_GQL, { fromBlock, toBlock: latestChainBlockNumber })
      .toPromise()
  ).data.contract.logs;

  if (!logs.length) {
    console.log("No historical logs found");
    break;
  }

  // Filter out repeated logs.
  if (
    !logs.find(
      (l) =>
        l.block.number != fromBlock ||
        !logIndicesFromTheLatestBlock.includes(l.logIndex)
    )
  ) {
    console.log("No new historical logs found");
    break;
  }

  const events = (
    await Promise.all(logs.map(logToEnergyPurchaseObject))
  ).filter((x) => x) as Web3EnergyPurchase[];

  if (events.length) {
    console.log(`Saving ${events.length} historical events`);

    await prisma.web3EnergyPurchase.createMany({
      data: events,
      skipDuplicates: true,
    });

    latestEnergyPurchaseBlock = events[events.length - 1].blockNumber;
  }

  fromBlock = logs[logs.length - 1].block.number;

  logIndicesFromTheLatestBlock = logs
    .filter((l) => l.block.number == fromBlock)
    .map((l) => l.logIndex);
}
