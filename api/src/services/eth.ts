import config from "@/config.js";
import { BigNumber, ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";
import ERC1155 from "@/abi/erc1155.json" assert { type: "json" };
import IERC721 from "@/abi/IERC721.json" assert { type: "json" };
import IERC165 from "@/abi/IERC165.json" assert { type: "json" };
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

export class UnknownNFTContractError extends Error {
  constructor() {
    super(`The contract is neither ERC721 nor ERC1155`);
  }
}

export async function nftOwnership(
  nftContractAddress: Buffer,
  nftId: BigNumber,
  account: Buffer
): Promise<boolean> {
  const erc165 = new ethers.Contract(
    ethers.utils.hexlify(nftContractAddress),
    IERC165,
    provider
  );

  const isERC1155 = await erc165.supportsInterface("0xd9b67a26");

  if (isERC1155) {
    const erc1155 = new ethers.Contract(
      ethers.utils.hexlify(nftContractAddress),
      ERC1155,
      provider
    );

    return (
      await erc1155.balanceOf(ethers.utils.hexlify(account), nftId.toString())
    ).gt(0);
  } else {
    const isERC721 = await erc165.supportsInterface("0x80ac58cd");

    if (isERC721) {
      const erc721 = new ethers.Contract(
        ethers.utils.hexlify(nftContractAddress),
        IERC721,
        provider
      );

      return (
        (await erc721.ownerOf(nftId.toString())) ===
        ethers.utils.hexlify(account)
      );
    } else {
      throw new UnknownNFTContractError();
    }
  }
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

  if (!fromBlock) {
    // QuickNode is limited to a 10000 blocks range.
    fromBlock = (await provider.getBlockNumber()) - 9000;
  }

  for await (const event of await contract.queryFilter(filter, fromBlock)) {
    yield {
      blockNumber: event.blockNumber,
      logIndex: event.logIndex,
      txHash: event.transactionHash,
      value: event.args!.value,
    };
  }
}
