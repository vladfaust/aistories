import { BigNumber, BigNumberish, ethers } from "ethers";
import { ref, Ref, ShallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import erc1155Abi from "@/assets/abi/erc1155.json";
import { web3Token } from "@/store";

declare global {
  interface Window {
    ethereum: any;
  }
}

const walletStorage = useLocalStorage<string | null>("ethWallet", null);

export const account: Ref<string | null> = ref(null);
export const provider: ShallowRef<ethers.providers.Web3Provider | null> =
  ref(null);

export async function connect() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!window.ethereum.selectedAddress) {
    throw "Did not select an Ethereum address";
  }

  provider.value = new ethers.providers.Web3Provider(window.ethereum, "any");
  account.value = window.ethereum.selectedAddress;
  walletStorage.value = "generic";

  window.ethereum.on("accountsChanged", function (accounts: string[]) {
    if (accounts.length > 0) {
      account.value = accounts[0];
    } else {
      disconnect();
    }
  });

  window.ethereum.on("disconnect", function () {
    disconnect();
  });

  window.ethereum.on("network", (_newNetwork: any, oldNetwork: any) => {
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    // See https://docs.ethers.io/v5/concepts/best-practices/.
    if (oldNetwork) {
      window.location.reload();
    }
  });

  window.ethereum.on("chainChanged", function (chainId: any) {
    window.location.reload();
  });
}

export async function disconnect() {
  window.ethereum.removeAllListeners();
  walletStorage.value = null;
  web3Token.value = null;
  account.value = null;
  provider.value = null;
}

export async function autoConnect() {
  if (walletStorage.value) {
    await connect();
  }
}

export async function getErc1155Balance(
  contractAddress: string,
  tokenId: BigNumberish,
  account: string
): Promise<BigNumber> {
  if (!provider.value) throw "No provider";

  const contract = new ethers.Contract(
    contractAddress,
    erc1155Abi,
    provider.value
  );

  return await contract.balanceOf(account, tokenId);
}
