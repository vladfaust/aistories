import config from "@/config.js";
import { ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";
import erc1155Abi from "~/abi/erc1155.json" assert { type: "json" };

export let provider: ethers.providers.BaseProvider;

console.log("Connecting to ethereum provider", {
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

console.info("HTTP provider connected");

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
