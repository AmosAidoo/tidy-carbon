import EditorSidebar from "@/components/editor-sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-separator"
import { ReactFlow, MiniMap, Controls, Background } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useEditorState } from "@/stores/editor-store"
import TransformationNode from "@/components/transformation-node"
import { StageType } from "../../../shared/types/stages"
import NodeRender from "@/components/node-render"
import { MdPreview } from "react-icons/md"
import SourceNode from "@/components/source-node"
import DestinationNode from "@/components/destination-node"
import { Button } from "@/components/ui/button"
import { Play, Save } from "lucide-react"

const nodeTypes = {
  [StageType.Transformation]: TransformationNode,
  [StageType.Source]: SourceNode,
  [StageType.Destination]: DestinationNode
}

const Editor = () => {
  const { 
    nodes, 
    onNodesChange,
    edges, 
    onConnect, 
    handleEdgesChange,
    isAnchoring,
    canvasRef,
    previewPosition,
    anchoringNodeSubType,
    onAddNode,
    isValidConnection
  } = useEditorState()

  return (
    <div className="w-screen h-screen">
      <SidebarProvider>
        <EditorSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Pipelines
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Pipeline Name</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto mr-2 flex gap-2">
              <Button variant="secondary">
                <Save />
                Save
              </Button>
              <Button>
                <Play />
                Run
              </Button>
            </div>
          </header>

          {isAnchoring && (
            // Later, this should preview the correct stage icon and title
            <NodeRender 
              icon={MdPreview} 
              title={anchoringNodeSubType || ""} 
              isPreview={true}
              style={{
                position: 'absolute',
                top: previewPosition.y,
                left: previewPosition.x,
                pointerEvents: 'none',
                zIndex: 10
              }}
              />
          )}
          <div ref={canvasRef} className="h-full relative" onClick={onAddNode}>
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={handleEdgesChange} 
              onConnect={onConnect}
              isValidConnection={(connection) => isValidConnection(connection, edges, nodes)}>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default Editor