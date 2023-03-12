import { Deferred } from "@/utils/deferred";
import * as api from "@/services/api";

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
    imageUrl: string;
    name: string;
    about: string;
  }): Lore {
    return new Lore(data.id, new URL(data.imageUrl), data.name, data.about);
  }

  constructor(
    readonly id: number,
    readonly imageUrl: URL,
    readonly name: string,
    readonly about: string
  ) {}
}
