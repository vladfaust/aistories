import { spawn } from "child_process";

// Spawn the python process, launching "./main.py"
const process = spawn("python", ["src/main.py"]);

process.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

process.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});

export { process };
