<script setup lang="ts">
import {
  computed,
  onMounted,
  type Ref,
  ref,
  type ShallowRef,
  markRaw,
} from "vue";
import { trpc } from "@/services/api";
import { sleep } from "@/utils";

const audioCtx = new AudioContext();

class Message {
  readonly id: number;
  readonly chatId: number;
  readonly actorId: number;
  readonly text: Ref<string>;
  readonly createdAt: Date;
  private _queue: { sentence: string; tts?: AudioBufferSourceNode }[] = [];
  completed = false;

  constructor(data: any, play: boolean) {
    this.id = data.id;
    this.chatId = data.chatId;
    this.actorId = data.actorId;
    this.text = ref(data.text || "");
    this.createdAt = new Date(data.createdAt);

    if (play) {
      this.play();
    }
  }

  push(sentence: string, tts?: AudioBufferSourceNode) {
    this._queue.push({ sentence, tts });
  }

  async play() {
    while (!this.completed) {
      const sentence = this._queue.shift();

      if (!sentence) {
        await sleep(200);
        continue;
      }

      console.debug("Playing", this.id, sentence.sentence);

      const ttsDuration = (sentence.tts?.buffer?.duration || 0) * 0.8;

      const promises = [
        delayedPrint(
          sentence.sentence,
          this.text,
          (ttsDuration * 1000) / sentence.sentence.length || 50
        ),
      ];

      if (sentence.tts) {
        sentence.tts.start();

        promises.push(
          new Promise<any>((resolve) => {
            sentence.tts?.addEventListener("ended", resolve);
          })
        );
      }

      await Promise.all(promises);
    }

    console.debug("Completed", this.id);
  }
}

async function delayedPrint(text: string, output: Ref<string>, delay: number) {
  console.debug("delayedPrint", text, delay);

  for (const char of text) {
    output.value = output.value + char;
    await sleep(delay);
  }
}

const inputText = ref("");

async function onEnter() {
  console.debug("Enter pressed, inputText: ", inputText.value);

  const request = inputText.value;
  inputText.value = "";

  const response = await trpc.createUserMessage.mutate(request);

  const message = messages.value.find((m) => m.id === response.id);
  if (!message) throw "Message to complete not found: " + response.id;
}

const messages: ShallowRef<Message[]> = ref([]);

const orderedMessages = computed(() => {
  return messages.value.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
});

onMounted(() => {
  trpc.getChatMessages.query().then((data) => {
    console.debug("getChatMessages: ", data);
    messages.value.push(...data.map((d) => markRaw(new Message(d, false))));
  });

  trpc.onCharMessageSentence.subscribe(undefined, {
    onData: async (data) => {
      console.debug("onCharMessageSentence/onData: ", data);

      const message = messages.value.find((m) => m.id === data.messageId);

      if (!message) {
        console.error("Message not found: ", data.messageId);
        return;
      }

      let tts: AudioBufferSourceNode | undefined;

      if (data.tts) {
        // Decode Base64 to ArrayBuffer
        const binaryString = atob(data.tts);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
          const ascii = binaryString.charCodeAt(i);
          bytes[i] = ascii;
        }

        // Decode ArrayBuffer to AudioBuffer
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);

        // Create AudioBufferSourceNode
        tts = audioCtx.createBufferSource();
        tts.buffer = audioBuffer;
        tts.connect(audioCtx.destination);
      }

      message.push(data.sentence, tts);
    },
    onError: (error) => {
      console.error("onCharMessageSentence/onError: ", error);
    },
  });

  trpc.onChatMessage.subscribe(undefined, {
    onData: (data) => {
      console.debug("onChatMessage/onData: ", data);
      messages.value.push(markRaw(new Message(data, data.actorId == 2)));
    },
    onError: (error) => {
      console.error("onChatMessage/onError: ", error);
    },
  });
});
</script>

<template lang="pug">
.flex.h-screen.flex-col.gap-2.p-4
  .flex.flex-col.gap-1.overflow-y-auto
    template(v-for="message of orderedMessages")
      template(v-if="message.actorId == 1")
        p 👤 {{ message.text.value }}
      template(v-else)
        p 🤖 {{ message.text.value }}
  textarea.h-32.w-full.border.p-4(
    placeholder="Input text"
    @keypress.enter.prevent.exact="onEnter"
    v-model="inputText"
  )
</template>
