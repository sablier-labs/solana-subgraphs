import { BigInt } from "@graphprotocol/graph-ts";
import { Action } from "../../generated/schema";
import { getChainCode, one, zero } from "../constants";
import { getOrCreateWatcher } from "./watcher";

export function getActionById(id: string): Action | null {
  return Action.load(id);
}

export function createAction(
  campaignId: string,
  category: string,
  hash: string,
  timestamp: BigInt,
  block: BigInt,
  instruction: BigInt
): Action {
  let watcher = getOrCreateWatcher();
  let id = generateActionId(hash, instruction);
  let entity = new Action(id);

  entity.block = block;
  entity.hash = hash;
  entity.timestamp = timestamp;

  entity.chainCode = watcher.chainCode;
  entity.chainId = watcher.chainId;
  entity.cluster = watcher.cluster;

  entity.category = category;
  entity.campaign = campaignId;

  entity.subgraphId = watcher.actionIndex;
  entity.fee = zero; // TODO: Implement fees

  /** --------------- */
  watcher.actionIndex = watcher.actionIndex.plus(one);
  watcher.save();

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateActionId(hash: string, instruction: BigInt): string {
  const chainCode = getChainCode();

  return ""
    .concat(hash)
    .concat("-")
    .concat(instruction.toString())
    .concat("-")
    .concat(chainCode);
}
