import GPT3Tokenizer from "gpt3-tokenizer";

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

export function tokenize(text: string) {
  return tokenizer.encode(text);
}
