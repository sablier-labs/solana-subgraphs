import { Protobuf } from "as-proto/assembly";
import { ProtoData } from "./adapters";
import {
  handleCancel,
  handleCreateStream,
  handleRenounce,
  handleSPLTransfer,
  handleWithdraw,
  handleWithdrawMax,
} from "./handlers";

export function handleTriggers(bytes: Uint8Array): void {
  const input = Protobuf.decode<ProtoData>(
    bytes,
    ProtoData.decode
  ) as ProtoData;

  for (let i = 0; i < input.cancelList.length; i++) {
    handleCancel(input.cancelList[i], input);
  }

  for (let i = 0; i < input.createList.length; i++) {
    handleCreateStream(input.createList[i], input);
  }

  for (let i = 0; i < input.renounceList.length; i++) {
    handleRenounce(input.renounceList[i], input);
  }

  for (let i = 0; i < input.splTransferList.length; i++) {
    handleSPLTransfer(input.splTransferList[i], input);
  }

  for (let i = 0; i < input.withdrawList.length; i++) {
    handleWithdraw(input.withdrawList[i], input);
  }

  for (let i = 0; i < input.withdrawMaxList.length; i++) {
    handleWithdrawMax(input.withdrawMaxList[i], input);
  }
}
