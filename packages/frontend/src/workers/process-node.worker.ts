import { processNode } from "shared/node-processors"
import { ProcessNodeWorkerIncomingMessage } from "./types/process-node"
import { WorkerMessageType } from "./types/worker-message"

self.onmessage = (event: MessageEvent<ProcessNodeWorkerIncomingMessage>) => {
  console.log("message received")
  const { config, inputData, isJoin } = event.data

  let outputData = null

  try {
    if (isJoin) {
      // Simulate progress for a Join transformation
      if (inputData.length === 2) {
        self.postMessage({ type: WorkerMessageType.Progress, message: "Processing join transformation..." })
        outputData = processNode(config, [inputData[0], inputData[1]])
      }
    } else {
      // Simulate progress for a regular transformation
      if (inputData.length === 1) {
        self.postMessage({ type: WorkerMessageType.Progress, message: "Processing transformation..." })
        outputData = processNode(config, inputData[0])
      }
    }

    // Send the final result
    self.postMessage({ type: WorkerMessageType.Result, data: outputData })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    self.postMessage({ type: WorkerMessageType.Error, message: error.message })
  }
}
