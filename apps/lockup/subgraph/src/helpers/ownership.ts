import { BigInt } from "@graphprotocol/graph-ts";
import { Ownership } from "../../generated/schema";
import { getChainCode, getChainId } from "../constants";

export function getOwnership(nftMint: string): Ownership | null {
  return Ownership.load(generateOwnershipId(nftMint));
}

export function createOwnership(
  nftMint: string,
  owner: string,
  ownerAta: string
): Ownership {
  let id = generateOwnershipId(nftMint);
  let entity = new Ownership(id);

  entity.chainCode = getChainCode();
  entity.chainId = getChainId();

  entity.nftMint = nftMint;
  entity.owner = owner;
  entity.ownerAta = ownerAta;

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateOwnershipId(nftMint: string): string {
  const chainCode = getChainCode();

  return ""
    .concat(nftMint)
    .concat("-")
    .concat(chainCode);
}
