import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import { BigNumber } from "ethers";
import { markRaw, ref, Ref } from "vue";
import Collection from "./Collection";

export default class Character {
  static cache = new Map<number, Deferred<Character | null>>();

  static findOrCreate(id: number): Deferred<Character | null> {
    let char = Character.cache.get(id);

    if (char) {
      return char;
    } else {
      char = new Deferred<Character | null>();
      Character.cache.set(id, char);

      api.trpc.commands.character.find.query({ id }).then((data) => {
        if (data) {
          char!.resolve(Character.fromBackendModel(data));
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
  }): Character {
    return markRaw(
      new Character(
        data.id,
        Collection.findOrCreate(data.collectionId) as Deferred<Collection>,
        data.name,
        data.about,
        new URL(data.imagePreviewUrl)
      )
    );
  }

  constructor(
    readonly id: number,
    readonly collection: Deferred<Collection>,
    readonly name: string,
    readonly about: string,
    readonly imagePreviewUrl: URL,
    readonly erc1155Token?: {
      address: string;
      id: string;
      uri: URL;
    },
    readonly balance: Ref<BigNumber | undefined> = ref()
  ) {}
}
