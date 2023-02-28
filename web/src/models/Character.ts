import { trpc } from "@/services/api";
import { account, getErc1155Balance } from "@/services/eth";
import { tap } from "@/utils";
import { Deferred } from "@/utils/deferred";
import { BigNumber, ethers } from "ethers";
import { computed, markRaw, ref, Ref, watch } from "vue";

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

      trpc.character.find.query({ id }).then((data) => {
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
    name: string;
    title: string;
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
    readonly about: string,
    readonly imagePreviewUrl: URL,
    readonly erc1155Token?: {
      address: string;
      id: string;
      uri: URL;
    },
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
          this.erc1155Token.address,
          this.erc1155Token.id,
          account
        ));
      }
    })());
  }
}
