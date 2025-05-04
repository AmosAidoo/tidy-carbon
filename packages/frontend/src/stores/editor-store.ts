import { useNodesState, useEdgesState, useReactFlow, Edge, addEdge, Connection, EdgeChange, applyEdgeChanges, Node, ReactFlowInstance } from "@xyflow/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { create } from "zustand"
import { StageSubType, StageType } from "shared/types/stages"
import { FilterConfig, FilterGroupOperator, JoinConfig, JoinType, MapConfig, SelectConfig, TransformationType } from "shared/types/transformations"
import { TransformationNode } from "@/components/transformation-node"
import { SourceNode } from "@/components/source-node"
import { SourceType } from "shared/types/sources"
import { DestinationNode } from "@/components/destination-node"
import { DestinationType } from "shared/types/destinations"
import useNodeDataStore, { useNodeDataState } from "./node-store"
import mockData from "../assets/MOCK_DATA"

interface MousePosition {
  x: number
  y: number
}

interface EditorNode  {
  id: string
  position: {
    x: number
    y: number
  }
  data: Record<string, unknown>
}

type EditorEdge = Edge

export interface EditorState {
  initialNodes: EditorNode[]
  initialEdges: EditorEdge[]
  setInitialNodes: (nodes: EditorNode[]) => void
  setInitialEdges: (edges: EditorEdge[]) => void
  isAnchoring: boolean
  rfInstance: ReactFlowInstance | null
  anchoringNodeType: StageType | null
  anchoringNodeSubType: StageSubType | null
  setAnchoringNodeType: (anchoringNodeType: StageType | null) => void
  setAnchoringNodeSubType: (anchoringNodeSubType: StageSubType | null) => void
  setIsAnchoring: (isAnchoring: boolean) => void
  onSelectNode: (type: StageType, subType: StageSubType) => void,
  setRfInstance: (rfInstance: ReactFlowInstance) => void
}

const useEditorStore = create<EditorState>((set) => ({
  initialNodes: [],
  initialEdges: [],
  anchoringNodeType: null,
  anchoringNodeSubType: null,
  setAnchoringNodeType: (newType: StageType | null) => set({ anchoringNodeType: newType }),
  setAnchoringNodeSubType: (newSubtype: StageSubType | null) => set({ anchoringNodeSubType: newSubtype }),
  setInitialNodes: (nodes: EditorNode[]) => set({ initialNodes: nodes }),
  setInitialEdges: (edges: EditorEdge[]) => set({ initialEdges: edges }),
  isAnchoring: false,
  rfInstance: null,
  setIsAnchoring: (newIsAnchoring: boolean) => set({ isAnchoring: newIsAnchoring }),
  onSelectNode: (type: StageType, subType: StageSubType) => {
    set({ isAnchoring: true })
    set({ anchoringNodeType: type, anchoringNodeSubType: subType })
  },
  setRfInstance: (rfInstance) => set({ rfInstance }),
}))

export const useEditorState = () => {
  const initialNodes = useEditorStore((state) => state.initialNodes)
  const initialEdges = useEditorStore((state) => state.initialEdges)
  
  const isAnchoring = useEditorStore(state => state.isAnchoring)
  const anchoringNodeType = useEditorStore(state => state.anchoringNodeType)
  const anchoringNodeSubType = useEditorStore(state => state.anchoringNodeSubType)
  const setIsAnchoring = useEditorStore(state => state.setIsAnchoring)
  const setAnchoringNodeType = useEditorStore(state => state.setAnchoringNodeType)
  const setAnchoringNodeSubType = useEditorStore(state => state.setAnchoringNodeSubType)
  
  const onSelectNode = useEditorStore(state => state.onSelectNode)
  
  // These will be used for data fetching
  const setInitialNodes = useEditorStore((state) => state.setInitialNodes)
  const setInitialEdges = useEditorStore((state) => state.setInitialEdges)
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })
  const [previewPosition, setPreviewPosition] = useState<MousePosition>({ x: 0, y: 0 })

  const rfInstance = useEditorStore((state) => state.rfInstance)
  const setRfInstance = useEditorStore((state) => state.setRfInstance)

  const { 
    setNodeData,
    markDownstreamNodesAsStale
  } = useNodeDataState()
  // Need to subscribe directly to nodeData changes
  const nodeData = useNodeDataStore((state) => state.nodeData)

  const reactFlowInstance = useReactFlow()
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isAnchoring) {
        // Reset anchoring state when Escape is pressed
        setIsAnchoring(false)
        setAnchoringNodeType(null)
        setAnchoringNodeSubType(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAnchoring, setIsAnchoring, setAnchoringNodeType, setAnchoringNodeSubType])

  useEffect(() => {
    setInitialNodes(nodes)
  }, [nodes, setInitialNodes])

  useEffect(() => {
    setInitialEdges(edges)
  }, [edges, setInitialEdges])

  const onSave = useCallback(() => {
    if (rfInstance) {
      let flow = rfInstance.toObject()
      flow = {
        ...flow,
        nodes: flow.nodes.map(node => ({
          ...node,
          config: nodeData[node.id].config
        })) as unknown as Node[]
      }
      alert(JSON.stringify(flow))
      // localStorage.setItem(flowKey, JSON.stringify(flow))
    }
  }, [rfInstance, nodeData])

  const getUpstreamSubgraph = useCallback((targetNodeId: string) => {
    if (rfInstance) {
      const flow = rfInstance.toObject()
      const visited = new Set()
      const queue = [targetNodeId]
      const upstreamEdges = new Set<string>()

      // Traverse upstream (reverse edges)
      while (queue.length > 0) {
        const current = queue.pop()
        if (visited.has(current)) continue
        visited.add(current)

        for (const edge of flow.edges) {
          if (edge.target === current) {
            upstreamEdges.add(edge.id)
            queue.push(edge.source)
          }
        }
      }
      
      const filteredNodes = flow.nodes.filter(n => visited.has(n.id)).map(node => ({
        ...node,
        config: nodeData[node.id].config
      }))
      const filteredEdges = flow.edges.filter(e => upstreamEdges.has(e.id))
      
      return {
        nodes: filteredNodes,
        edges: filteredEdges,
      }
    }
  }, [rfInstance])

  const isValidConnection = (connection: Edge | Connection, edges: Edge[], nodes: Node[]) => {
    const targetNode = nodes.find((node) => node.id === connection.target)
    if (!targetNode) return false
    
    const existingConnections = edges.filter((edge) => edge.target === connection.target)
    if (targetNode.data.subType === TransformationType.Join) {
      // Allow at most two incoming connections for "Join" nodes
      return existingConnections.length < 2
    } else {
      // Allow only one incoming connection for other nodes
      return existingConnections.length === 0
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isValidConnection(connection, edges, nodes)) {
        setEdges((previousEdges) => {
          const newEdges = addEdge({...connection, markerEnd: "arrowclosed", type: "step" }, previousEdges)
          if (connection.target) {
            markDownstreamNodesAsStale(connection.target, nodes, newEdges)
          }
          return newEdges
        })
      }
      
    },
    [edges, markDownstreamNodesAsStale, nodes, setEdges],
  )
  
  const handleMouseMove = (event: MouseEvent) => {
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const x = event.clientX - canvasRect.left
      const y = event.clientY
      setPreviewPosition({x, y})
    }

    if (reactFlowInstance) {
      const flowPosition = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setMousePosition(flowPosition)
    }
  }

  const onAddNode = () => {
    if (isAnchoring) {
      // Create a new node(stage) of the correct type and subtype
      let newNode: SourceNode | TransformationNode | DestinationNode | null = null
      
      switch(anchoringNodeType) {
        case StageType.Source:
          switch(anchoringNodeSubType) {
            case SourceType.Demo: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Source,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              setNodeData(newNode.id, {
                isStale: false,
                data: mockData
              })
              break
            }
            case SourceType.GoogleCloudStorage: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Source,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              break
            }
          }
          break
        case StageType.Destination:
          switch(anchoringNodeSubType) {
            case DestinationType.GoogleCloudStorage: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Destination,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              break
            }
          }
          break
        case StageType.Transformation:
          switch(anchoringNodeSubType) {
            case TransformationType.Aggregate: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              break
            }
            case TransformationType.Filter: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              const config: FilterConfig = {
                type: TransformationType.Filter,
                rules: {
                  type: "Group",
                  conditions: [],
                  operator: FilterGroupOperator.AND
                }
              }
              setNodeData(newNode.id, {
                config,
                isStale: true
              })
              break
            }
            case TransformationType.Join: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              const config: JoinConfig = {
                type: TransformationType.Join,
                joinType: JoinType.Inner,
                leftField: "",
                rightField: ""
              }
              setNodeData(newNode.id, {
                config,
                isStale: true
              })
              break
            }
            case TransformationType.Map: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              const config: MapConfig = {
                type: TransformationType.Map,
                fields: []
              }
              setNodeData(newNode.id, {
                config,
                isStale: true
              })
              break
            }
            case TransformationType.Select: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              const config: SelectConfig = {
                type: TransformationType.Select,
                fields: []
              }
              setNodeData(newNode.id, {
                config,
                isStale: true
              })
              break
            }
            case TransformationType.Sort: {
              newNode = {
                id: `${nodes.length + 1}`,
                position: mousePosition,
                type: StageType.Transformation,
                data: {
                  label: `${anchoringNodeSubType}_${nodes.length + 1}`,
                  subType: anchoringNodeSubType
                }
              }
              break
            }
          }
          break
        default:
      }
      if (newNode) {
        setNodes((prevNodes) => [...prevNodes, newNode])
      }
      setIsAnchoring(false)
      setAnchoringNodeType(null)
      setAnchoringNodeSubType(null)
    }
  }

  const handleEdgesChange = (changes: EdgeChange<EditorEdge>[]) => {
    setEdges((prevEdges) => {
      const updatedEdges = applyEdgeChanges(changes, prevEdges)
      // Handle edge removals
      changes.forEach((change) => {
        if (change.type === "remove") {
          if (change.id) {
            const targetNode = edges.find((edge) => edge.id === change.id)?.target
            if (targetNode) {
              const existingNodeData = nodeData[targetNode]
              if (existingNodeData) {
                setNodeData(targetNode, {
                  config: existingNodeData.config,
                  isStale: true,
                })
              }
              markDownstreamNodesAsStale(targetNode, nodes, updatedEdges)
            }
          }
        }
      })
  
      return updatedEdges // Return the updated edges to update the state
    })
  }

  // All data fetching happens here
  // End of data fetching

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    handleEdgesChange,
    onConnect,
    isAnchoring,
    anchoringNodeType,
    anchoringNodeSubType,
    setIsAnchoring,
    onSelectNode,
    mousePosition,
    previewPosition,
    canvasRef,
    onAddNode,
    isValidConnection,
    rfInstance,
    setRfInstance,
    onSave,
    getUpstreamSubgraph
  }
}

export default useEditorStore