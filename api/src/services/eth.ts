import config from "@/config.js";
import { BigNumber, ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";
import erc1155Abi from "@/abi/erc1155.json" assert { type: "json" };
import receiverAbi from "@/abi/receiver.json" assert { type: "json" };
import konsole from "./konsole";

export let provider: ethers.providers.BaseProvider;

konsole.log(["eth"], "Connecting...", {
  url: config.eth.httpRpcUrl.toString(),
});

provider = new ethers.providers.JsonRpcProvider(
  config.eth.httpRpcUrl.toString()
);

await timeout(5000, provider.ready, "Ethereum provider not ready");

assert(
  (await provider.getNetwork()).chainId === config.eth.chainId,
  "Ethereum chain ID mismatch"
);

konsole.log(["eth"], "Connected");

export async function erc1155Balance(
  erc1155Address: string,
  erc1155Id: string,
  address: string
) {
  const contract = new ethers.Contract(
    ethers.utils.hexlify(erc1155Address),
    erc1155Abi,
    provider
  );

  return await contract.balanceOf(ethers.utils.hexlify(address), erc1155Id);
}

export async function* getReceiverEvents(
  address: string,
  fromBlock?: number
): AsyncGenerator<{
  blockNumber: number;
  logIndex: number;
  txHash: string;
  value: BigNumber;
}> {
  const contract = new ethers.Contract(
    ethers.utils.hexlify(config.eth.receiverAddress),
    receiverAbi,
    provider
  );

  const filter = contract.filters.Receive(address);

  for await (const event of await contract.queryFilter(filter, fromBlock)) {
    yield {
      blockNumber: event.blockNumber,
      logIndex: event.logIndex,
      txHash: event.transactionHash,
      value: event.args!.value,
    };
  }
}
