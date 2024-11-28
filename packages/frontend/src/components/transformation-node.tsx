import { VscGroupByRefType, VscListSelection } from "react-icons/vsc"
import { TransformationType } from "../../../shared/types/transformations"
import { StageType } from "../../../shared/types/stages"
import { FaFilter } from "react-icons/fa6"
import { MdMerge } from "react-icons/md"
import { TbTransform } from "react-icons/tb"
import { FaSortAmountDownAlt } from "react-icons/fa"
import { Handle, Node, NodeProps, Position } from "@xyflow/react"
import NodeRender from "./node-render"
import { useState } from "react"
import FilterConfigModal from "./config-modals/filter-config-modal"
import SelectConfigModal from "./config-modals/select-config-modal"
import JoinConfigModal from "./config-modals/join-config-modal"

export const TransformationNodeIcons = {
  [TransformationType.Aggregate]: VscGroupByRefType,
  [TransformationType.Filter]: FaFilter,
  [TransformationType.Join]: MdMerge,
  [TransformationType.Map]: TbTransform,
  [TransformationType.Select]: VscListSelection,
  [TransformationType.Sort]: FaSortAmountDownAlt
}

export const TransformationNodeConfigModals = {
  [TransformationType.Filter]: FilterConfigModal,
  [TransformationType.Select]: SelectConfigModal,
  [TransformationType.Join]: JoinConfigModal
}

export type TransformationNode = Node<
  {
    label: string,
    subType: TransformationType
  },
  StageType.Transformation
>

const TransformationNode = (props: NodeProps<TransformationNode>) => {
  const [configIsOpen, setConfigIsOpen] = useState(false)

  const handleDoubleClick = () => {
    setConfigIsOpen(true)
  }

  const IconComponent = TransformationNodeIcons[props.data.subType]
  const ConfigModal = TransformationNodeConfigModals[props.data.subType]

  return (
    <>
      <Handle position={Position.Top} type="target" />
      <NodeRender icon={IconComponent} title={props.data.label} onDoubleClick={handleDoubleClick} />
      <Handle position={Position.Bottom} type="source" />
      {/* Render Config Modal Here */}
      { ConfigModal && <ConfigModal id={props.id} title={props.data.subType} label={props.data.label} open={configIsOpen} onOpenChange={setConfigIsOpen} /> }
    </>
  )
}

export default TransformationNode