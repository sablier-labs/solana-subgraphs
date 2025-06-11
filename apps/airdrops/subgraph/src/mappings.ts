import { Protobuf } from "as-proto/assembly";
import { ProtoData } from "./adapters";
import { handleClaim, handleClawback, handleCreate } from "./handlers";

export function handleTriggers(bytes: Uint8Array): void {
  const input = Protobuf.decode<ProtoData>(
    bytes,
    ProtoData.decode
  ) as ProtoData;

  for (let i = 0; i < input.claimList.length; i++) {
    handleClaim(input.claimList[i], input);
  }

  for (let i = 0; i < input.clawbackList.length; i++) {
    handleClawback(input.clawbackList[i], input);
  }

  for (let i = 0; i < input.createList.length; i++) {
    handleCreate(input.createList[i], input);
  }
}
