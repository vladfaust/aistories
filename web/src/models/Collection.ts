import { Deferred } from "@/utils/deferred";
import * as api from "@/services/api";

export default class Collection {
  static cache = new Map<number, Deferred<Collection | null>>();

  static findOrCreate(id: number): Deferred<Collection | null> {
    let collection = Collection.cache.get(id);

    if (collection) {
      return collection;
    } else {
      collection = new Deferred<Collection | null>();
      Collection.cache.set(id, collection);

      api.trpc.commands.collections.find.query({ id }).then((data) => {
        if (data) {
          collection!.resolve(Collection.fromBackendModel(data));
        } else {
          collection!.resolve(null);
        }
      });
    }

    return collection;
  }

  static fromBackendModel(data: {
    id: number;
    imageUrl: string;
    name: string;
    about: string;
  }): Collection {
    return new Collection(
      data.id,
      new URL(data.imageUrl),
      data.name,
      data.about
    );
  }

  constructor(
    readonly id: number,
    readonly imageUrl: URL,
    readonly name: string,
    readonly about: string
  ) {}
}
