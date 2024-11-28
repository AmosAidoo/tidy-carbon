import { Handle, Node, NodeProps, Position } from "@xyflow/react"
import { StageType } from "../../../shared/types/stages"
import { SourceType } from "../../../shared/types/sources"
import { PiDatabaseFill } from "react-icons/pi";
import { SiGooglecloudstorage } from "react-icons/si";
import NodeRender from "./node-render";
import DemoDataConfigModal from "./config-modals/demo-data-config-modal";
import { useState } from "react";

export const SourceNodeIcons = {
  [SourceType.Demo]: PiDatabaseFill,
  [SourceType.GoogleCloudStorage]: SiGooglecloudstorage
}

export const SourceNodeConfigModals = {
  [SourceType.Demo]: DemoDataConfigModal
}

export type SourceNode = Node<
  {
    label: string
    subType: SourceType
  },
  StageType.Source
>

const SourceNode = (props: NodeProps<SourceNode>) => {
  const [configIsOpen, setConfigIsOpen] = useState(false)

  const handleDoubleClick = () => {
    setConfigIsOpen(true)
  }

  const IconComponent = SourceNodeIcons[props.data.subType]
  const ConfigModal = SourceNodeConfigModals[props.data.subType]
  return (
    <>
      <NodeRender icon={IconComponent} title={props.data.label} onDoubleClick={handleDoubleClick} />
      <Handle position={Position.Bottom} type="source" />
      { ConfigModal && <ConfigModal id={props.id} title={props.data.subType} label={props.data.label} open={configIsOpen} onOpenChange={setConfigIsOpen} /> }
    </>
  )
}

export default SourceNode