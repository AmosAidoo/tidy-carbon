import { create } from "zustand"
import { TransformationConfig } from "shared/types/transformations"
import { getOutgoers, Node, Edge } from "@xyflow/react"
import { SchemaField } from "@/api/useApi"

export enum NodeDataLoadingState {
  Processing = "processing",
  Error = "error",
  Done = "done"
}

export interface NodeData<T extends TransformationConfig> {
  config?: T
  incomingFields?: SchemaField[]
  fields?: SchemaField[]
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

  return {
    setNodeData,
    useGetNodeData,
    markDownstreamNodesAsStale,
  }
}

export default useNodeDataStore
