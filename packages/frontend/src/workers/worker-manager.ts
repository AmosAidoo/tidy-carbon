// worker-manager.ts
import ProcessNodeWorker from "./process-node.worker?worker"

let processNodeWorker: Worker | null = null

export const getProcessNodeWorker = (): Worker => {
  if (!processNodeWorker) {
    processNodeWorker = new ProcessNodeWorker()
  }
  return processNodeWorker
}
