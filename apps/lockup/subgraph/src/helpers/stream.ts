import { BigInt } from "@graphprotocol/graph-ts";
import { Stream, Contract } from "../../generated/schema";
import { getChainCode, one, zero } from "../constants";
import { getOrCreateContract } from "./contract";
import { getOrCreateWatcher } from "./watcher";
import { getOrCreateAsset } from "./asset";
import { EventCreate, ProtoData } from "../adapters";

function createStream(
  nftMint: string,
  program: string,
  instruction: BigInt,
  hash: string,
  timestamp: BigInt
): Stream | null {
  let watcher = getOrCreateWatcher();

  /** --------------- */
  let contract = getOrCreateContract(program);

  /** --------------- */
  let id = generateStreamId(nftMint, program);
  if (id == null) {
    return null;
  }

  let alias = generateStreamAlias(nftMint, contract);

  /** --------------- */
  let entity = new Stream(id);
  /** --------------- */

  entity.contract = contract.id;
  entity.hash = hash;
  entity.instruction = instruction;
  entity.timestamp = timestamp;

  entity.chainCode = watcher.chainCode;
  entity.chainId = watcher.chainId;
  entity.cluster = watcher.cluster;

  entity.alias = alias;
  entity.version = contract.version;
  entity.subgraphId = watcher.streamIndex;

  /** --------------- */
  entity.cliff = false;
  entity.initial = false;
  entity.canceled = false;
  entity.renounceAction = null;
  entity.canceledAction = null;
  entity.initialAmount = null;
  entity.cliffAmount = null;
  entity.cliffTime = null;
  entity.transferable = true; /**  All streams are transferable by default */
  entity.withdrawnAmount = zero;

  entity.senderAta = null; /** We don't initialize a recipientAta since it may (1) be unavailable at create and (2) change with transfers or withdraw-to */

  /** --------------- */
  watcher.streamIndex = watcher.streamIndex.plus(one);
  watcher.save();

  return entity;
}

export function createLinearStream(
  event: EventCreate,
  system: ProtoData
): Stream | null {
  let entity = createStream(
    event.nftMint,
    event.instructionProgram,
    BigInt.fromU64(event.instructionIndex),
    event.transactionHash,
    BigInt.fromI64(system.blockTimestamp)
  );

  if (entity == null) {
    return null;
  }

  /** --------------- */
  entity.salt = event.salt;
  entity.category = "LockupLinear";
  entity.sender = event.sender;
  entity.recipient = event.recipient;
  entity.recipientNFTAta = event.nftRecipientAta;

  entity.senderAta = event.senderAta;

  entity.nftMint = event.nftMint;
  entity.nftData = event.nftData;

  entity.parties = [event.sender, event.recipient];

  entity.depositAmount = BigInt.fromU64(event.depositedAmount);
  entity.intactAmount = BigInt.fromU64(event.depositedAmount);

  entity.startTime = BigInt.fromU64(event.startTime);
  entity.endTime = BigInt.fromU64(event.endTime);
  entity.cancelable = !!event.cancelable;

  /** --------------- */
  entity.duration = BigInt.fromI64(event.totalDuration);

  /** --------------- */
  let cliffTime = BigInt.fromU64(event.cliffTime);
  let cliffAmount = BigInt.fromU64(event.cliffAmount);

  if (!cliffTime.isZero()) {
    entity.cliff = true;
    entity.cliffAmount = cliffAmount;
    entity.cliffTime = cliffTime;
  } else {
    entity.cliff = false;
  }

  let initialAmount = BigInt.fromU64(event.initialAmount);
  if (!initialAmount.isZero()) {
    entity.initial = true;
    entity.initialAmount = initialAmount;
  }

  /** --------------- */
  let asset = getOrCreateAsset(
    event.depositTokenMint,
    event.depositTokenProgram,
    event.depositTokenDecimals
  );
  entity.asset = asset.id;

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateStreamId(nftMint: string, program: string): string {
  const chainCode = getChainCode();

  let id = ""
    .concat(program)
    .concat("-")
    .concat(chainCode)
    .concat("-")
    .concat(nftMint);

  return id;
}

export function generateStreamAlias(
  nftMint: string,
  contract: Contract
): string {
  let alias = ""
    .concat(contract.alias)
    .concat("-")
    .concat(contract.chainCode)
    .concat("-")
    .concat(nftMint);

  return alias;
}

export function getStreamByNftMint(
  nftMint: string,
  program: string
): Stream | null {
  let id = generateStreamId(nftMint, program);
  return Stream.load(id);
}

export function getStreamById(streamId: string): Stream | null {
  return Stream.load(streamId);
}
