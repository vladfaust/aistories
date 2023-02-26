export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Box<T> {
  constructor(public value: T) {}
}

export function displayAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function addRemoveClassAfterTimeout(
  element: HTMLElement,
  classNames: string[],
  ms: number
) {
  element.classList.add(...classNames);
  setTimeout(() => element.classList.remove(...classNames), ms);
}

export function tap<T>(object: T, fn: (object: T) => void): T {
  fn(object);
  return object;
}
