import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import Character from "./Character";
import { markRaw } from "vue";

export default class Story {
  static cache = new Map<number, Story>();

  static fromBackendModel(data: {
    id: number;
    charIds: number[];
    userIds: number[];
    userMap: Record<number, number>;
    name: string | null;
    fabula: string | null;
    Content: {
      charId: number;
      content: string | null;
      createdAt: string;
    }[];
  }): Story {
    return markRaw(
      new Story(
        data.id,

        data.userIds.map((userId) => ({
          userId,
          char: Character.findOrCreate(
            data.userMap[userId]
          ) as Deferred<Character>,
        })),

        data.charIds.map(
          (c) => Character.findOrCreate(c) as Deferred<Character>
        ),

        data.name,
        data.fabula,
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

  static findOrCreate(id: number): Deferred<Story | undefined> {
    const deferred = new Deferred<Story | undefined>();

    if (Story.cache.has(id)) {
      deferred.resolve(Story.cache.get(id));
    } else {
      api.commands.story.find
        .query({
          storyId: id,
        })
        .then((data) => {
          if (data) {
            deferred.resolve(
              this.fromBackendModel({
                ...data,
                userMap: JSON.parse(data.userMap) as Record<number, number>,
              })
            );
          } else {
            deferred.resolve(undefined);
          }
        });
    }

    return deferred;
  }

  private constructor(
    readonly id: number,
    readonly users: { userId: number; char: Deferred<Character> }[],
    readonly characters: Deferred<Character>[],
    readonly name: string | null,
    readonly fabula: string | null,
    readonly latestContent: {
      character: Deferred<Character>;
      content: string | null;
      createdAt: Date;
    } | null
  ) {}
}
