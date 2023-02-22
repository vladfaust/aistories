import config from "@/config.js";
import { ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";

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
