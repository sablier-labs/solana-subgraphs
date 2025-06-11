import { BigInt } from "@graphprotocol/graph-ts";
import { Contract } from "../../generated/schema";
import {
  getChainCode,
  getChainId,
  getCluster,
  getContractsLockupLinear
} from "../constants";

export function getContractByAddress(address: string): Contract | null {
  return Contract.load(generateContractId(address));
}

export function getContractById(id: string): Contract | null {
  return Contract.load(id);
}

export function getOrCreateContract(address: string): Contract {
  let id = generateContractId(address);
  let entity = getContractByAddress(address);

  if (entity == null) {
    entity = new Contract(id);
  } else {
    return entity;
  }

  /** Check if the contract is a Lockup Linear */

  let linear = getContractsLockupLinear();
  let index = _findContractIndex(linear, address);
  if (index == -1) {
    throw new Error(
      `Missing contract ${address} from configuration ${linear
        .map<string>(item => item[0])
        .join(",")}`
    );
  }

  const definition = linear[index];

  entity.alias = definition[1];
  entity.address = address;
  entity.chainCode = getChainCode();
  entity.chainId = getChainId();
  entity.cluster = getCluster();
  entity.category = "LockupLinear";
  entity.version = definition[2];

  entity.save();
  return entity;
}

/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */
/** --------------------------------------------------------------------------------------------------------- */

export function generateContractId(address: string): string {
  const chainCode = getChainCode();

  return ""
    .concat(address)
    .concat("-")
    .concat(chainCode);
}

function _findContractIndex(haystack: string[][], needle: string): i32 {
  let index: i32 = -1;
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i][0] == needle) {
      index = i;
      break;
    }
  }
  return index;
}
