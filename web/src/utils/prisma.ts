import { ethers } from "ethers";

export type Buffer = {
  type: "Buffer";
  data: number[];
};

export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.data);
}

export function bufferToHex(buffer: Buffer): string {
  return ethers.utils.hexlify(bufferToUint8Array(buffer));
}
