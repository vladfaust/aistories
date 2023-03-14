import GPT3Tokenizer from "gpt3-tokenizer";

export function tokenize(text: string, type: "gpt3" | "codex" = "gpt3") {
  const tokenizer = new GPT3Tokenizer({ type });
  return tokenizer.encode(text);
}
