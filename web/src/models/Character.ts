import config from "@/config";
import * as api from "@/services/api";
import { account, getErc1155Balance } from "@/services/eth";
import { tap } from "@/utils";
import { Deferred } from "@/utils/deferred";
import { BigNumber } from "ethers";
import { computed, markRaw, ref, Ref, watch, WatchStopHandle } from "vue";
import Lore from "./Lore";
import { Buffer, bufferToHex } from "@/utils/prisma";

// An NFT is either ERC-721 or ERC-1155.
export type NFT = {
  contractAddress: string; // Hex string.
  tokenId: string; // Hex string.
  uri: string; // URI to the NFT page.
};

export default class Character {
  static cache = new Map<number, Deferred<Character | null>>();

  private _fetchBalancePromise?: Promise<BigNumber | undefined>;
  readonly collected = computed(
    () => !this.nft.value || this.balance.value?.gt(0)
  );
  private watchBalanceStopHandle?: WatchStopHandle;

  static findOrCreate(id: number): Deferred<Character | null> {
    let char = Character.cache.get(id);

    if (char) {
      return char;
    } else {
      char = new Deferred<Character | null>();
      Character.cache.set(id, char);

      api.trpc.commands.characters.find.query({ id }).then((data) => {
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
    loreId: number;
    creatorId: string;
    public: boolean;
    name: string;
    about: string;
    personality?: string;
    nftContractAddress: Buffer | null;
    nftTokenId: Buffer | null;
    nftUri: string | null;
    createdAt: string;
    updatedAt: string;
  }): Character {
    return markRaw(
      new Character(
        data.id,
        Lore.findOrCreate(data.loreId) as Deferred<Lore>,
        data.creatorId,
        ref(data.public),
        ref(data.name),
        ref(data.about),
        data.personality ? ref(data.personality) : undefined,
        data.nftContractAddress
          ? ref({
              contractAddress: bufferToHex(data.nftContractAddress!),
              tokenId: bufferToHex(data.nftTokenId!),
              uri: data.nftUri!,
            })
          : ref(null),
        ref(),
        new Date(data.createdAt),
        new Date(data.updatedAt)
      )
    );
  }

  constructor(
    readonly id: number,
    readonly lore: Deferred<Lore>,
    readonly creatorId: string,
    readonly public_: Ref<boolean>,
    readonly name: Ref<string>,
    readonly about: Ref<string>,
    readonly personality: Ref<string> | undefined,
    readonly nft: Ref<NFT | null>,
    readonly balance: Ref<BigNumber | undefined>,
    readonly createdAt: Date,
    readonly updatedAt: Date
  ) {}

  watchBalance() {
    this.watchBalanceStopHandle?.();

    return (this.watchBalanceStopHandle = watch(
      account,
      (account) => {
        this.balance.value = undefined;
        this._fetchBalancePromise = undefined;
        if (account) this.fetchBalance(account);
      },
      { immediate: true }
    ));
  }

  async fetchBalance(account: string): Promise<BigNumber | undefined> {
    return (this._fetchBalancePromise ||= (async () => {
      if (!this.nft.value) {
        return undefined;
      } else {
        return (this.balance.value ||= await getErc1155Balance(
          this.nft.value.contractAddress,
          this.nft.value.tokenId,
          account
        ));
      }
    })());
  }

  get imageUrl(): URL {
    return new URL(config.cdnUrl + "chars/" + this.id + "/image");
  }
}
