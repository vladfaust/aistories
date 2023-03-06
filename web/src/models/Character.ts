import * as api from "@/services/api";
import { account, getErc1155Balance } from "@/services/eth";
import { tap } from "@/utils";
import { Deferred } from "@/utils/deferred";
import { BigNumber } from "ethers";
import { computed, markRaw, ref, Ref, watch } from "vue";
import Collection from "./Collection";

type Erc1155Token = {
  contractAddress: string; // Hex string.
  tokenId: string; // Hex string.
  uri: string; // URI to the NFT page.
};

export default class Character {
  static cache = new Map<number, Deferred<Character | null>>();

  private _fetchBalancePromise?: Promise<BigNumber | undefined>;
  readonly collected = computed(
    () => !this.erc1155Token || this.balance.value?.gt(0)
  );

  static findOrCreate(id: number): Deferred<Character | null> {
    let char = Character.cache.get(id);

    if (char) {
      return char;
    } else {
      char = new Deferred<Character | null>();
      Character.cache.set(id, char);

      api.trpc.commands.character.find.query({ id }).then((data) => {
        if (data) {
          char!.resolve(
            tap(Character.fromBackendModel(data), (c) => c.watchBalance())
          );
        } else {
          char!.resolve(null);
        }
      });
    }

    return char;
  }

  static fromBackendModel(data: {
    id: number;
    collectionId: number;
    name: string;
    about: string;
    imagePreviewUrl: string;
    erc1155Token: Erc1155Token | null;
  }): Character {
    return markRaw(
      new Character(
        data.id,
        Collection.findOrCreate(data.collectionId) as Deferred<Collection>,
        data.name,
        data.about,
        new URL(data.imagePreviewUrl),
        data.erc1155Token
      )
    );
  }

  constructor(
    readonly id: number,
    readonly collection: Deferred<Collection>,
    readonly name: string,
    readonly about: string,
    readonly imagePreviewUrl: URL,
    readonly erc1155Token: Erc1155Token | null,
    readonly balance: Ref<BigNumber | undefined> = ref()
  ) {}

  private watchBalance() {
    return watch(
      account,
      (account) => {
        console.debug("watchBalance", account);
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
          this.erc1155Token.contractAddress,
          this.erc1155Token.tokenId,
          account
        ));
      }
    })());
  }
}
