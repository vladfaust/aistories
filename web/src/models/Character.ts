export type Character = {
  id: number;
  name: string;
  title: string;
  publicSynopsis: string;
  about: string;
  imagePreviewUrl: string;
  erc1155Address: { type: "Buffer"; data: number[] } | null;
  erc1155Id: { type: "Buffer"; data: number[] } | null;
};
