import { Watcher } from "../../generated/schema";
import { getChainCode, getChainId, getCluster, one } from "../constants";

export function getOrCreateWatcher(): Watcher {
  let id = getChainCode().toString();
  let entity = Watcher.load(id);

  if (entity == null) {
    entity = new Watcher(id);
    entity.chainCode = getChainCode();
    entity.chainId = getChainId();
    entity.cluster = getCluster();
    entity.streamIndex = one;
    entity.actionIndex = one;
    entity.initialized = true;
    entity.logs = [];
    entity.save();
  }

  return entity;
}
