import { ChildProcess, spawn } from "child_process";

export const processes: Record<number, ChildProcess> = {};

export function spawnProcess(): ChildProcess {
  const process = spawn("python", ["src/main.py"]);
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
