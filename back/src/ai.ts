import { ChildProcess, spawn } from "child_process";

export const processes: Record<number, ChildProcess> = {};

export function spawnProcess({
  promptTemplate,
  summarizerTemplate,
  conversationSummary,
  conversationBuffer,
}: {
  promptTemplate?: string;
  summarizerTemplate?: string;
  conversationSummary: string;
  conversationBuffer: string[];
}): ChildProcess {
  const process = spawn("python", [
    "src/main.py",
    JSON.stringify({
      template: promptTemplate,
      summarizer_template: summarizerTemplate,
      moving_summary_buffer: conversationSummary,
      buffer: conversationBuffer,
    }),
  ]);

  if (!process.pid) throw new Error("Failed to spawn process");

  process.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  processes[process.pid] = process;
  return process;
}
