import { useForm } from "react-hook-form"
import ConfigModalBase from "./config-modal-base"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNodeDataState } from "@/stores/node-store"
import { JoinConfig, JoinType, TransformationType } from "shared/types/transformations"
import { useEffect, useState } from "react"
import { getIncomers, useEdges, useNodes } from "@xyflow/react"
import { Button } from "../ui/button"
import { ArrowLeftRight } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"


const formSchema = z.object({
  label: z.string(),
  joinType: z.nativeEnum(JoinType),
  leftField: z.string(),
  rightField: z.string()
})

interface JoinConfigModalProps {
  id: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const JoinConfigModal = ({ id, label, onOpenChange, open } : JoinConfigModalProps) => {
  const nodes = useNodes()
  const edges = useEdges()

  const [leftTable, setLeftTable] = useState("")
  const [rightTable, setRightTable] = useState("")
  
  const {
    useGetNodeData,
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<JoinConfig>(id)

  const leftNodeData = useGetNodeData<JoinConfig>(leftTable)
  const rightNodeData = useGetNodeData<JoinConfig>(rightTable)

  useEffect(() => {
    if (open) {
      const incomers = getIncomers({ id }, nodes, edges)
      // Now grab the left and right tables and set them
      // in the appropriate state variables. If they don't
      // exist, then assume the incomers positions as the
      // correct ones
      if (leftTable) {
        setLeftTable(leftTable)
      } else if (currentNodeData.config?.leftTable) {
        setLeftTable(currentNodeData.config?.leftTable)
      } else {
        if (incomers.length >= 1)
          setLeftTable(incomers[0].id)
      }

      if (rightTable) {
        setRightTable(rightTable)
      } else if (currentNodeData.config?.rightTable) {
        setRightTable(currentNodeData.config.rightTable)
      } else {
        if (incomers.length > 1)
          setRightTable(incomers[1].id)
      }
    }
  }, [currentNodeData.config?.leftTable, currentNodeData.config?.rightTable, edges, id, leftTable, nodes, open, rightTable])

  const form = useForm<z.infer<typeof formSchema> & { type: TransformationType.Join }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: label,
      joinType: currentNodeData.config?.joinType,
      leftField: currentNodeData.config?.leftField,
      rightField: currentNodeData.config?.rightField
    },
  })

  const updateConfig = (values: JoinConfig): JoinConfig => {
    return {
      ...values,
      type: TransformationType.Join,
    }
  }

  const onSwapIncomersPositions = () => {
    const temp = leftTable
    setLeftTable(rightTable)
    setRightTable(temp)
  }
  
  return (
    <ConfigModalBase<JoinConfig>
      id={id}
      form={form}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Join Transformation"
      updateConfig={updateConfig}
    >
      <div>
        <h3>Data Position</h3>
        <div className="grid grid-cols-3">
          <div className="flex justify-center content-center">{ nodes.find(node => node.id == leftTable)?.data?.label as string }</div>
          
          <div className="flex justify-center">
            <Button onClick={onSwapIncomersPositions}>
              <ArrowLeftRight />
            </Button>
          </div>

          <div className="flex justify-center content-center">{ nodes.find(node => node.id == rightTable)?.data?.label as string }</div>
        </div>
      </div>

      <div>
        <h3>Join Keys</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="leftField"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ nodes.find(node => node.id == leftTable)?.data?.label as string || "No data" }</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select left table key" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {
                        leftNodeData?.data && 
                        Array.isArray(leftNodeData?.data) &&
                        Object.keys((leftNodeData?.data as never[])[0])?.length && 
                        Object.keys((leftNodeData?.data as never[])[0])?.map((field, idx) => (
                          <SelectItem key={idx} value={field}>{field}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="rightField"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ nodes.find(node => node.id == rightTable)?.data?.label as string || "No data" }</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select right table key" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {
                        rightNodeData?.data && 
                        Array.isArray(rightNodeData?.data) &&
                        Object.keys((rightNodeData?.data as never[])[0])?.length && 
                        Object.keys((rightNodeData?.data as never[])[0])?.map((field, idx) => (
                          <SelectItem key={idx} value={field}>{field}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
     
    </ConfigModalBase>
  )
}

export default JoinConfigModal