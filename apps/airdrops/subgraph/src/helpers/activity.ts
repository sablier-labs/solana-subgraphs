import { BigInt } from "@graphprotocol/graph-ts";
import { Activity } from "../../generated/schema";
import { log_exit, zero } from "../constants";
import { getCampaignById } from "./campaign";

export function getActivityById(id: string): Activity | null {
  return Activity.load(id);
}

export function getOrCreateActivity(
  campaignId: string,
  timestamp: BigInt
): Activity | null {
  let day = timestamp.div(BigInt.fromI32(60 * 60 * 24));

  /** --------------- */
  let campaign = getCampaignById(campaignId);
  if (campaign == null) {
    log_exit(
      "Campaign hasn't been registered before this activity update: {}",
      [campaignId]
    );
    return null;
  }

  /** --------------- */

  let id = generateActivityId(campaignId, day.toString());
  let entity = getActivityById(id);

  if (entity != null) {
    return entity;
  }

  entity = new Activity(id);
  entity.day = day;
  entity.campaign = campaign.id;
  entity.timestamp = timestamp;

  entity.amount = zero;
  entity.claims = zero;

  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateActivityId(campaignId: string, day: string): string {
  return ""
    .concat("activity")
    .concat("-")
    .concat(campaignId)
    .concat("-")
    .concat(day);
}
