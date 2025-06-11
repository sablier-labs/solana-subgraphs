import { Factory } from "../../generated/schema";
import {
  getChainCode,
  getChainId,
  getCluster,
  getContractsMerkleInstant,
  zero
} from "../constants";

export function getFactoryByAddress(address: string): Factory | null {
  return Factory.load(generateFactoryId(address));
}

export function getFactoryById(id: string): Factory | null {
  return Factory.load(id);
}

export function getOrCreateFactory(address: string): Factory {
  let id = generateFactoryId(address);
  let entity = getFactoryByAddress(address);

  if (entity == null) {
    entity = new Factory(id);
  } else {
    return entity;
  }

  /** Check if the contract is a Merkle Instant */

  let contracts = getContractsMerkleInstant();
  let index = _findFactoryIndex(contracts, address);
  if (index == -1) {
    throw new Error(
      `Missing contract ${address} from configuration ${contracts
        .map<string>(item => item[0])
        .join(",")}`
    );
  }

  const definition = contracts[index];

  entity.alias = definition[1];
  entity.address = address;
  entity.chainCode = getChainCode();
  entity.chainId = getChainId();
  entity.cluster = getCluster();
  entity.version = definition[2];

  entity.campaignIndex = zero;

  entity.save();
  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateFactoryId(address: string): string {
  const chainCode = getChainCode();

  return ""
    .concat(address)
    .concat("-")
    .concat(chainCode);
}

function _findFactoryIndex(haystack: string[][], needle: string): i32 {
  let index: i32 = -1;
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i][0] == needle) {
      index = i;
      break;
    }
  }
  return index;
}
