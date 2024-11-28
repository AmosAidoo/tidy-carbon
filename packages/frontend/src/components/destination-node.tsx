import { Handle, Node, NodeProps, Position } from "@xyflow/react"
import { DestinationType } from "../../../shared/types/destinations"
import { SiGooglecloudstorage } from "react-icons/si"
import NodeRender from "./node-render"
import { StageType } from "../../../shared/types/stages"

export const DestinationNodeIcons = {
  [`${DestinationType.GoogleCloudStorage}`]: SiGooglecloudstorage
}

export type DestinationNode = Node<
  {
    label: string
    subType: DestinationType
  },
  StageType.Destination
>

const DestinationNode = (props: NodeProps<DestinationNode>) => {
  const IconComponent = DestinationNodeIcons[props.data.subType]
  return (
    <>
      <NodeRender icon={IconComponent} title={props.data.label} />
      <Handle position={Position.Top} type="target" />
    </>
  )
}

export default DestinationNode