export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Box<T> {
  constructor(public value: T) {}
}

export function displayAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
