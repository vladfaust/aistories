import * as offchainCafe from "@/services/offchainCafe";
import { gql } from "@urql/core";
import config from "@/config";
import receiverAbi from "~/abi/receiver.json" assert { type: "json" };
import { BigNumber, ethers } from "ethers";
import { OnChainEnergyPurchase, PrismaClient } from "@prisma/client";
import { toBuffer } from "./utils";
import { pipe, subscribe } from "wonka";

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

async function logToOnChainEnergyPurchaseObject(
  log: Log
): Promise<OnChainEnergyPurchase | null> {
  console.debug("Processing log", log);
  const amount = BigNumber.from(log.data);

  if (amount.lt(minAmount)) {
    console.log("Ignoring log with amount < MIN_VALUE");
    return null;
  }

  const evmAddress = toBuffer("0x" + log.topics[1].slice(26));

  const user = await prisma.user.upsert({
    where: {
      evmAddress,
    },
    update: {},
    create: {
      evmAddress,
    },
  });

  const energy = amount
    .mul(EXCHANGE_RATE)
    .div(ethers.constants.WeiPerEther)
    .toNumber();

  const obj = {
    blockNumber: log.block.number,
    logIndex: log.logIndex,
    txHash: toBuffer(log.transaction.hash),
    blockTime: new Date(log.block.timestamp * 1000),
    userId: user.id,
    energy,
    value: toBuffer(amount._hex),
  };

  return obj;
}

const EXCHANGE_RATE = 25; // X energy per 1 ETH
const MIN_VALUE = 0.05; // In ETH
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
      topics: [["${receiveEventTopic}"]]) {
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

const prisma = new PrismaClient();

let latestOnChainEnergyPurchaseBlock =
  (
    await prisma.onChainEnergyPurchase.findFirst({
      orderBy: {
        blockNumber: "desc",
      },
      select: {
        blockNumber: true,
      },
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

    const event = await logToOnChainEnergyPurchaseObject(log);
    if (event) {
      console.log(`Saving realtime event`, event);

      return prisma.onChainEnergyPurchase.createMany({
        data: [event],
        skipDuplicates: true,
      });
    }
  })
);

let fromBlock = latestOnChainEnergyPurchaseBlock;
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
    await Promise.all(logs.map(logToOnChainEnergyPurchaseObject))
  ).filter((x) => x) as OnChainEnergyPurchase[];

  if (events.length) {
    console.log(`Saving ${events.length} historical events`, events);

    await prisma.onChainEnergyPurchase.createMany({
      data: events,
      skipDuplicates: true,
    });

    latestOnChainEnergyPurchaseBlock = events[events.length - 1].blockNumber;
  }

  fromBlock = logs[logs.length - 1].block.number;

  logIndicesFromTheLatestBlock = logs
    .filter((l) => l.block.number == fromBlock)
    .map((l) => l.logIndex);
}
