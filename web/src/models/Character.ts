import { ethers } from "ethers";

export class Character {
  readonly id: number;
  readonly name: string;
  readonly title: string;
  readonly publicSynopsis: string;
  readonly about: string;
  readonly imagePreviewUrl: URL;
  readonly erc1155Token?: {
    address: string;
    id: string;
  };

  constructor(data: {
    id: number;
    name: string;
    title: string;
    publicSynopsis: string;
    about: string;
    imagePreviewUrl: string;
    erc1155Address: { type: "Buffer"; data: number[] } | null;
    erc1155Id: { type: "Buffer"; data: number[] } | null;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.title = data.title;
    this.publicSynopsis = data.publicSynopsis;
    this.about = data.about;
    this.imagePreviewUrl = new URL(data.imagePreviewUrl);

    if (data.erc1155Address) {
      this.erc1155Token = {
        address: ethers.utils.hexlify(data.erc1155Address.data),
        id: ethers.utils.hexlify(data.erc1155Id!.data),
      };
    }
  }
}
