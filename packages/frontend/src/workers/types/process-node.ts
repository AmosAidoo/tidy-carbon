import { WorkerMessageType } from "./worker-message"
import { TransformationConfig } from "shared/types/transformations"

export interface ProcessNodeWorkerIncomingMessage {
  config: TransformationConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any[]
  isJoin: boolean
}

export interface ProcessNodeWorkerOutgoingMessage {
  type: WorkerMessageType
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}