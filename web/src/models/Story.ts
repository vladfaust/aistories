import { trpc } from "@/services/api";
import { Deferred } from "@/utils/deferred";
import Character from "./Character";
import * as web3Auth from "@/services/web3Auth";
import { markRaw } from "vue";

export default class Story {
  static cache = new Map<number, Story>();

  static findOrCreate(id: number): Deferred<Story | undefined> {
    const deferred = new Deferred<Story | undefined>();

    if (Story.cache.has(id)) {
      deferred.resolve(Story.cache.get(id));
    } else {
      web3Auth.ensure().then((authToken) => {
        trpc.story.find
          .query({
            authToken,
            storyId: id,
          })
          .then((story) => {
            if (story) {
              deferred.resolve(
                markRaw(
                  new Story(
                    story.id,
                    story.userId,
                    Character.findOrCreate(
                      story.characterId
                    ) as Deferred<Character>,
                    story.name
                  )
                )
              );
            } else {
              deferred.resolve(undefined);
            }
          });
      });
    }

    return deferred;
  }
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly character: Deferred<Character>,
    readonly name: string | null
  ) {}
}
