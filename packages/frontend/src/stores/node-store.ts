import { create } from "zustand"
import { TransformationConfig, TransformationType } from "shared/types/transformations"
import { processNode } from "shared/node-processors"
import { getOutgoers, getIncomers, Node, Edge } from "@xyflow/react"
import { getProcessNodeWorker } from "@/workers/worker-manager"
import { ProcessNodeWorkerOutgoingMessage } from "@/workers/types/process-node"
import { WorkerMessageType } from "@/workers/types/worker-message"

export enum NodeDataLoadingState {
  Processing = "processing",
  Error = "error",
  Done = "done"
}

export interface NodeData<T extends TransformationConfig> {
  config?: T
  fields?: string[]
  data?: unknown[]
  isStale?: boolean
  loadingState?: NodeDataLoadingState
}

interface NodeDataStore {
  nodeData: Record<string, NodeData<TransformationConfig>>
  setNodeData: <T extends TransformationConfig>(nodeId: string, data: NodeData<T>) => void
}

const useNodeDataStore = create<NodeDataStore>((set) => ({
  nodeData: {},
  setNodeData: (nodeId, data) => {
    set((state) => ({
      nodeData: { ...state.nodeData, [nodeId]: data },
    }))
  },
}))


export const useNodeDataState = () => {
  const setNodeData = useNodeDataStore((state) => state.setNodeData)
  const useGetNodeData = <T extends TransformationConfig>(nodeId: string): NodeData<T> => 
    useNodeDataStore((state) => state.nodeData[nodeId]) as NodeData<T>

  const markDownstreamNodesAsStale = (nodeId: string, nodes: Node[], edges: Edge[]) => {
    const targetNode = nodes.find((n) => n.id === nodeId)
    const state = useNodeDataStore.getState()
    const { nodeData } = state

    if (targetNode) {
      const outgoers = getOutgoers({ id: targetNode.id }, nodes, edges)
  
      outgoers.forEach((outgoer) => {
        const outgoerData = nodeData[outgoer.id]
        setNodeData(outgoer.id, { ...outgoerData, isStale: true })
        markDownstreamNodesAsStale(outgoer.id, nodes, edges)
      })
    }
  }

  // Without workers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const evaluateUpstreamNodesNoWorker = (nodeId: string, nodes: Node[], edges: Edge[]) => {
    const state = useNodeDataStore.getState()
    const { nodeData } = state
    const targetNode = nodes.find((n) => n.id === nodeId)
    
    if (targetNode) {
      const incomers = getIncomers(targetNode, nodes, edges)

      incomers.forEach((incomer) => {
        if (nodeData[incomer.id]?.isStale) {
          evaluateUpstreamNodes(incomer.id, nodes, edges)
        }
      })
    
      const inputData = incomers.map((incomer) => nodeData[incomer.id])
      
      if (inputData.length) {
        let outputData
        const config = nodeData[nodeId].config

        if (targetNode.data?.subType == TransformationType.Join) {
          if (inputData.length == 2) {
            // This is a Join
            if (config && inputData[0].data && inputData[1].data) {
              // TODO: Identify which incoming data is the left and which is the right
              outputData = processNode(config, [inputData[0].data, inputData[1].data])
              console.log("outputData", outputData)
              setNodeData(nodeId, { data: outputData.output, fields: outputData.fields, config, isStale: false })
            }
          }
        } else {
          if (inputData.length == 1) {
            if (config && inputData[0].data) {
              outputData = processNode(config, inputData[0].data)
              setNodeData(nodeId, { data: outputData.output, fields: outputData.fields, config, isStale: false })
            }
          }
        }
      }
    }
  }

  const evaluateUpstreamNodes = (nodeId: string, nodes: Node[], edges: Edge[]) => {
    const state = useNodeDataStore.getState()
    const { nodeData } = state
    const targetNode = nodes.find((n) => n.id === nodeId)
  
    if (targetNode) {
      setNodeData(nodeId, { ...nodeData[targetNode.id], loadingState: NodeDataLoadingState.Processing })
      const incomers = getIncomers(targetNode, nodes, edges)
  
      // Recursively evaluate upstream nodes
      incomers.forEach((incomer) => {
        if (nodeData[incomer.id]?.isStale) {
          evaluateUpstreamNodes(incomer.id, nodes, edges)
        }
      })
  
      const inputData = incomers.map((incomer) => nodeData[incomer.id])
      const config = nodeData[nodeId]?.config
  
      if (inputData.length) {
        const worker = getProcessNodeWorker()
  
        // Set up the message payload
        const payload = {
          config,
          inputData: inputData.map((data) => data?.data),
          isJoin: targetNode.data?.subType === TransformationType.Join
        }
  
        worker.postMessage(payload)
  
        worker.onmessage = (event: MessageEvent<ProcessNodeWorkerOutgoingMessage>) => {
          const { type, data } = event.data
          console.log("received results", type, data)
          if (type === WorkerMessageType.Result) {
            console.log(data)
            setNodeData(nodeId, { 
              data: data?.output, 
              fields: data?.fields, 
              config, 
              isStale: false, 
              loadingState: NodeDataLoadingState.Done 
            })
          } else if (type == WorkerMessageType.Error) {
            setNodeData(nodeId, { ...nodeData[targetNode.id], loadingState: NodeDataLoadingState.Error })
          }
        }
  
        worker.onerror = (error) => {
          console.error("Worker error:", error)
          setNodeData(nodeId, { ...nodeData[targetNode.id], loadingState: NodeDataLoadingState.Error })
        }
      } else { 
        setNodeData(nodeId, { ...nodeData[targetNode.id], loadingState: NodeDataLoadingState.Error }) 
      }
    }
  }

  return {
    setNodeData,
    useGetNodeData,
    markDownstreamNodesAsStale,
    evaluateUpstreamNodes
  }
}

export default useNodeDataStore
