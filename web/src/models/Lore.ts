import { Deferred } from "@/utils/deferred";
import * as api from "@/services/api";
import config from "@/config";
import { markRaw, ref, Ref, shallowRef, ShallowRef } from "vue";
import Character from "./Character";

export default class Lore {
  static cache = new Map<number, Deferred<Lore | null>>();

  static findOrCreate(id: number): Deferred<Lore | null> {
    let lore = Lore.cache.get(id);

    if (lore) {
      return lore;
    } else {
      lore = new Deferred<Lore | null>();
      Lore.cache.set(id, lore);

      api.trpc.commands.lores.find.query({ id }).then((data) => {
        if (data) {
          lore!.resolve(Lore.fromBackendModel(data));
        } else {
          lore!.resolve(null);
        }
      });
    }

    return lore;
  }

  static fromBackendModel(data: {
    id: number;
    creatorId: string;
    public: boolean;
    name: string;
    about: string;
    setup?: string;
    createdAt: string;
    updatedAt: string;
  }): Lore {
    return markRaw(
      new Lore(
        data.id,
        data.creatorId,
        ref(data.public),
        ref(data.name),
        ref(data.about),
        data.setup ? ref(data.setup) : undefined,
        new Date(data.createdAt),
        new Date(data.updatedAt),
        shallowRef([])
      )
    );
  }

  constructor(
    readonly id: number,
    readonly creatorId: string,
    readonly public_: Ref<boolean>,
    readonly name: Ref<string>,
    readonly about: Ref<string>,
    readonly prompt: Ref<string> | undefined,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly characters: ShallowRef<Deferred<Character>[]>
  ) {}

  get imageUrl(): URL {
    return new URL(config.cdnUrl + "lores/" + this.id + "/image");
  }

  async loadCharacters() {
    this.characters.value = (
      await api.trpc.commands.characters.filterByLore.query({ loreId: this.id })
    ).map((id) => Character.findOrCreate(id) as Deferred<Character>);
  }
}
