import Cryptr from "cryptr";

const cryptr = new Cryptr(process.env.CRYPTR_SECRET!);

export function getCryptr() {
  return cryptr;
}
