import chalk from "chalk";

enum LogLevel {
  LOG = "L",
  WARN = "W",
  ERROR = "E",
}

function prefix(group: string[], level: LogLevel): string {
  let s = `[${level}]`;
  s += `[${new Date().toISOString()}]`;

  if (group.length > 0) {
    s += `[${group.join(":")}]`;
  }

  switch (level) {
    case LogLevel.LOG:
      return chalk.blue(s + " ");
    case LogLevel.WARN:
      return chalk.yellow(s + " ");
    case LogLevel.ERROR:
      return chalk.red(s + " ");
  }
}

function log(
  group: string[] = [],
  message: string,
  ...optionalParams: any[]
): void {
  console.log(prefix(group, LogLevel.LOG) + message, ...optionalParams);
}

function warn(
  group: string[] = [],
  message: string,
  ...optionalParams: any[]
): void {
  console.warn(prefix(group, LogLevel.WARN) + message, ...optionalParams);
}

function error(
  group: string[] = [],
  message: string,
  ...optionalParams: any[]
): void {
  console.error(prefix(group, LogLevel.ERROR) + message, ...optionalParams);
}

const konsole = {
  log,
  warn,
  error,
};

export default konsole;
