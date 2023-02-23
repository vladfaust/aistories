import { account, getErc1155Balance } from "@/services/eth";
import { BigNumber, ethers } from "ethers";
import { computed, markRaw, ref, Ref, watch } from "vue";

export class Character {
  private _fetchBalancePromise?: Promise<BigNumber | undefined>;
  readonly collected = computed(() => this.balance.value?.gt(0));

  static fromBackendModel(data: {
    id: number;
    name: string;
    title: string;
    publicSynopsis: string;
    about: string;
    imagePreviewUrl: string;
    erc1155Address: { type: "Buffer"; data: number[] } | null;
    erc1155Id: { type: "Buffer"; data: number[] } | null;
    erc1155NftUri: string | null;
  }): Character {
    return markRaw(
      new Character(
        data.id,
        data.name,
        data.title,
        data.publicSynopsis,
        data.about,
        new URL(data.imagePreviewUrl),
        data.erc1155Address
          ? {
              address: ethers.utils.hexlify(data.erc1155Address.data),
              id: ethers.utils.hexlify(data.erc1155Id!.data),
              uri: new URL(data.erc1155NftUri!),
            }
          : undefined
      )
    );
  }

  constructor(
    readonly id: number,
    readonly name: string,
    readonly title: string,
    readonly publicSynopsis: string,
    readonly about: string,
    readonly imagePreviewUrl: URL,
    readonly erc1155Token?: {
      address: string;
      id: string;
      uri: URL;
    },
    readonly balance: Ref<BigNumber | undefined> = ref()
  ) {}

  watchBalance() {
    return watch(
      account,
      (account) => {
        this.balance.value = undefined;
        this._fetchBalancePromise = undefined;
        if (account) this.fetchBalance(account);
      },
      { immediate: true }
    );
  }

  async fetchBalance(account: string): Promise<BigNumber | undefined> {
    return (this._fetchBalancePromise ||= (async () => {
      if (!this.erc1155Token) {
        return undefined;
      } else {
        return (this.balance.value ||= await getErc1155Balance(
          this.erc1155Token.address,
          this.erc1155Token.id,
          account
        ));
      }
    })());
  }
}
