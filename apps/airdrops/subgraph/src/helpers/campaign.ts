import { BigInt } from "@graphprotocol/graph-ts";
import { Campaign } from "../../generated/schema";
import { getChainCode, log_exit, one, zero } from "../constants";
import { getOrCreateWatcher } from "./watcher";
import { getOrCreateFactory } from "./factory";
import { getOrCreateAsset } from "./asset";
import { EventCreate, ProtoData } from "../adapters";

function createCampaign(
  campaignAccount: string,
  program: string,
  instruction: BigInt,
  hash: string,
  timestamp: BigInt
): Campaign | null {
  let watcher = getOrCreateWatcher();

  /** --------------- */
  let factory = getOrCreateFactory(program);

  /** --------------- */
  let id = generateCampaignId(campaignAccount);
  if (id == null) {
    return null;
  }

  /** --------------- */
  let entity = new Campaign(id);
  /** --------------- */

  entity.address = campaignAccount;
  entity.factory = factory.id;
  entity.hash = hash;
  entity.instruction = instruction;
  entity.timestamp = timestamp;

  entity.chainCode = watcher.chainCode;
  entity.chainId = watcher.chainId;
  entity.cluster = watcher.cluster;

  entity.version = factory.version;
  entity.subgraphId = watcher.campaignIndex;

  /** --------------- */

  entity.clawbackAction = null;
  entity.clawbackTime = null;

  entity.claimedAmount = zero;
  entity.claimedCount = zero;

  /** --------------- */

  let index = factory.campaignIndex.plus(one);

  factory.campaignIndex = index;
  factory.save();

  /** --------------- */

  entity.position = index;
  entity.fee = zero;

  /** --------------- */

  watcher.campaignIndex = watcher.campaignIndex.plus(one);
  watcher.save();

  return entity;
}

export function createCampaignInstant(
  event: EventCreate,
  system: ProtoData
): Campaign | null {
  let entity = createCampaign(
    event.campaign,
    event.instructionProgram,
    BigInt.fromU64(event.instructionIndex),
    event.transactionHash,
    BigInt.fromI64(system.blockTimestamp)
  );

  if (entity == null) {
    log_exit("Campaign hasn't been registered.");
    return null;
  }

  entity.category = "Instant";
  entity.admin = event.creator;
  entity.ata = event.campaignAta;

  entity.expiration = BigInt.fromU64(event.expiration);
  entity.expires = event.expiration !== 0;

  entity.name = event.name;
  entity.root = event.merkleRoot;
  entity.ipfsCID = event.ipfsCid;
  entity.aggregateAmount = BigInt.fromU64(event.aggregatedAmount);
  entity.totalRecipients = BigInt.fromU64(event.recipientCount);

  /** --------------- */
  let asset = getOrCreateAsset(
    event.airdropTokenMint,
    event.airdropTokenProgram,
    event.airdropTokenDecimals
  );
  entity.asset = asset.id;

  entity.save();

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateCampaignId(campaignAccount: string): string {
  const chainCode = getChainCode();

  let id = ""
    .concat(campaignAccount)
    .concat("-")
    .concat(chainCode);

  return id;
}

export function getCampaignByAccount(campaignAccount: string): Campaign | null {
  let id = generateCampaignId(campaignAccount);
  return Campaign.load(id);
}

export function getCampaignById(campaignId: string): Campaign | null {
  return Campaign.load(campaignId);
}
