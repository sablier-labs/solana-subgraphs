import { BigInt } from "@graphprotocol/graph-ts";
import { Asset } from "../../generated/schema";
import { getChainId, getChainCode, getCluster } from "../constants";

export function getOrCreateAsset(mint: string, program: string, decimals: u32): Asset {
  let id = generateAssetId(mint);

  let entity = Asset.load(id);

  if (entity == null) {
    entity = new Asset(id);

    entity.chainCode = getChainCode();
    entity.chainId = getChainId();
    entity.cluster = getCluster();
    entity.address = mint;
    entity.mint = mint;
    entity.program = program;
    entity.decimals = BigInt.fromU32(decimals);

    entity.save();
  }

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateAssetId(address: string): string {
  const chainCode = getChainCode();

  return ""
    .concat(address)
    .concat("-")
    .concat(chainCode);
}
