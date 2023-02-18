export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Box<T> {
  constructor(public value: T) {}
}
