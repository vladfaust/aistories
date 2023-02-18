import config from "@/config.js";

export async function tts(
  text: string,
  voiceId: string,
  voice_settings: {
    stability: number;
    similarity_boost: number;
  } = {
    stability: 0,
    similarity_boost: 0,
  }
): Promise<ArrayBuffer> {
  const response = await fetch(
    config.elevenLabs.baseUrl + "v1/text-to-speech/" + voiceId,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Xi-Api-Key": config.elevenLabs.apiKey,
      },
      body: JSON.stringify({
        text,
        voice_settings,
      }),
    }
  );

  if (!response.ok) {
    console.error(response);
    throw new Error("Failed to fetch tts");
  }

  // The response is a stream of bytes, content type is audio/mpeg.
  return response.arrayBuffer();
}
