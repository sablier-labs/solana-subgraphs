import { BigInt } from "@graphprotocol/graph-ts";

import { EventClaim, EventClawback, EventCreate, ProtoData } from "../adapters";
import {
  createCampaignInstant,
  getCampaignByAccount
} from "../helpers/campaign";
import { createAction } from "../helpers/action";
import { log_exit, one } from "../constants";
import { getOrCreateActivity } from "../helpers/activity";

export function handleClaim(event: EventClaim, system: ProtoData): void {
  let campaign = getCampaignByAccount(event.campaign);
  if (campaign == null) {
    log_exit("Campaign not registered yet");
    return;
  }

  let action = createAction(
    campaign.id,
    "Claim",
    event.transactionHash,
    BigInt.fromI64(system.blockTimestamp),
    BigInt.fromU64(system.blockNumber),
    BigInt.fromU64(event.instructionIndex)
  );

  if (action == null) {
    log_exit("Campaign not registered yet, cannot bind claim action");
    return;
  }

  /** --------------- */
  action.claimIndex = BigInt.fromU64(event.index);
  action.claimAmount = BigInt.fromU64(event.amount);
  action.claimRecipient = event.recipient;
  action.claimReceipt = event.receipt;
  action.save();

  /** --------------- */
  campaign.claimedAmount = campaign.claimedAmount.plus(
    BigInt.fromU64(event.amount)
  );
  campaign.claimedCount = campaign.claimedCount.plus(one);
  campaign.save();

  /** --------------- */
  let activity = getOrCreateActivity(
    campaign.id,
    BigInt.fromI64(system.blockTimestamp)
  );
  if (activity == null) {
    log_exit("Activity not registered yet");
    return;
  }

  activity.claims = activity.claims.plus(one);
  activity.amount = activity.amount.plus(BigInt.fromU64(event.amount));
  activity.save();
}

export function handleClawback(event: EventClawback, system: ProtoData): void {
  let campaign = getCampaignByAccount(event.campaign);
  if (campaign == null) {
    log_exit("Campaign not registered yet");
    return;
  }

  let action = createAction(
    campaign.id,
    "Clawback",
    event.transactionHash,
    BigInt.fromI64(system.blockTimestamp),
    BigInt.fromU64(system.blockNumber),
    BigInt.fromU64(event.instructionIndex)
  );

  if (action == null) {
    log_exit("Campaign not registered yet, cannot bind clawback action");
    return;
  }

  /** --------------- */
  action.clawbackFrom = event.creator;
  action.clawbackTo = event.creator;
  action.clawbackAmount = BigInt.fromU64(event.amount);

  /** --------------- */
  action.save();

  /** --------------- */
  campaign.clawbackTime = BigInt.fromI64(system.blockTimestamp);
  campaign.clawbackAction = action.id;
  campaign.save();
}

export function handleCreate(event: EventCreate, system: ProtoData): void {
  let campaign = createCampaignInstant(event, system);

  if (campaign == null) {
    return;
  }

  campaign.save();

  let action = createAction(
    campaign.id,
    "Create",
    event.transactionHash,
    BigInt.fromI64(system.blockTimestamp),
    BigInt.fromU64(system.blockNumber),
    BigInt.fromU64(event.instructionIndex)
  );

  if (action == null) {
    log_exit("Campaign not registered yet, cannot bind create action");
    return;
  }

  action.campaign = campaign.id;
  action.save();
}
