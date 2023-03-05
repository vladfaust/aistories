import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  CreateCompletionResponse,
  OpenAIApi,
} from "openai";
import konsole from "./konsole";

export async function createChatCompletion(
  apiKey: string,
  messages: ChatCompletionRequestMessage[],
  maxTokens: number,
  {
    temperature = 1,
    topP = 1,
    presencePenalty = 0,
    frequencyPenalty = 0,
  }: {
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  }
): Promise<CreateChatCompletionResponse> {
  const openai = new OpenAIApi(new Configuration({ apiKey }));

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
    });

    return response.data;
  } catch (e: any) {
    if (e.response) {
      konsole.warn(["ai", "openai"], "OpenAI API error", {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
      });
    }

    throw e;
  }
}

export async function createCompletion(
  apiKey: string,
  prompt: string,
  maxTokens: number
): Promise<CreateCompletionResponse> {
  const openai = new OpenAIApi(new Configuration({ apiKey }));

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: maxTokens,
    });

    return response.data;
  } catch (e: any) {
    if (e.response) {
      konsole.warn(["ai", "openai"], "OpenAI API error", {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data,
      });
    }

    throw e;
  }
}
