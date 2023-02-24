import { ethers } from "ethers";

export class Deferred<T> {
  private readonly _promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: any) => void;

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get promise(): Promise<T> {
    return this._promise;
  }

  resolve = (value: T | PromiseLike<T>): void => {
    this._resolve(value);
  };

  reject = (reason?: any): void => {
    this._reject(reason);
  };
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(
  ms: number,
  promise: Promise<T>,
  message?: string
): Promise<T> {
  const deferred = new Deferred<T>();

  const timeout = setTimeout(() => {
    deferred.reject(new Error(message || "Promise timed out"));
  }, ms);

  promise
    .then((value) => {
      clearTimeout(timeout);
      deferred.resolve(value);
    })
    .catch((error) => {
      clearTimeout(timeout);
      deferred.reject(error);
    });

  return deferred.promise;
}

export function toBuffer(
  value: Parameters<typeof ethers.utils.arrayify>[0]
): Buffer {
  return Buffer.from(ethers.utils.arrayify(value));
}

export function toHex(
  value: Parameters<typeof ethers.utils.hexlify>[0]
): string {
  return ethers.utils.hexlify(value);
}
