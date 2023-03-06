import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import Character from "./Character";
import { markRaw, ref, Ref, shallowRef, ShallowRef } from "vue";
import Collection from "./Collection";

export default class Story {
  static cache = new Map<string, Story>();

  static fromBackendModel(data: {
    id: string;
    collectionId: number;
    charIds: number[];
    userId: string;
    userCharId: number;
    name: string | null;
    fabula: string | null;
    reason: string | null;
    Content: {
      charId: number;
      content: string | null;
      createdAt: string;
    }[];
  }): Story {
    return markRaw(
      new Story(
        data.id,
        Collection.findOrCreate(data.collectionId) as Deferred<Collection>,

        {
          id: data.userId,
          char: Character.findOrCreate(data.userCharId) as Deferred<Character>,
        },

        shallowRef(
          data.charIds.map(
            (c) => Character.findOrCreate(c) as Deferred<Character>
          )
        ),

        data.name,
        data.fabula,
        ref(data.reason),

        data.Content.length > 0
          ? {
              character: Character.findOrCreate(
                data.Content[0].charId
              ) as Deferred<Character>,
              content: data.Content[0].content,
              createdAt: new Date(data.Content[0].createdAt),
            }
          : null
      )
    );
  }

  static findOrCreate(id: string): Deferred<Story | undefined> {
    const deferred = new Deferred<Story | undefined>();

    if (Story.cache.has(id)) {
      deferred.resolve(Story.cache.get(id));
    } else {
      api.trpc.commands.story.find.query({ storyId: id }).then((data) => {
        if (data) {
          deferred.resolve(this.fromBackendModel(data));
        } else {
          deferred.resolve(undefined);
        }
      });
    }

    return deferred;
  }

  private constructor(
    readonly id: string,
    readonly collection: Deferred<Collection>,
    readonly user: { id: string; char: Deferred<Character> },
    readonly characters: ShallowRef<Deferred<Character>[]>,
    readonly name: string | null,
    readonly fabula: string | null,
    readonly reason: Ref<string | null>,
    readonly latestContent: {
      character: Deferred<Character>;
      content: string | null;
      createdAt: Date;
    } | null
  ) {}
}
