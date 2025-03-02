import { useFieldArray, useForm } from "react-hook-form"
import ConfigModalBase from "./config-modal-base"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNodeDataState } from "@/stores/node-store"
import { MapConfig, TransformationType } from "shared/types/transformations"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { CircleX } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import ExpressionEditor from "../expression-editor"

const formSchema = z.object({
  label: z.string(),
  fields: z.array(z.object({
    key: z.string(),
    expression: z.string()
  }))
})

interface MapConfigModalProps {
  id: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const MapConfigModal = ({ id, label, onOpenChange, open } : MapConfigModalProps) => {
  const {
    useGetNodeData,
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<MapConfig>(id)

  const form = useForm<z.infer<typeof formSchema> & { type: TransformationType.Map }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: label,
      fields: currentNodeData.config?.fields || []
    },
  })

  const { fields, append, remove } = useFieldArray({
    name: "fields",
    control: form.control
  })

  const updateConfig = (values: MapConfig): MapConfig => {
    return {
      ...values,
      type: TransformationType.Map,
    }
  }
  
  return (
    <ConfigModalBase<MapConfig>
      id={id}
      form={form}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Map Transformation"
      updateConfig={updateConfig}
    >
      <FormField
        control={form.control}
        name="fields"
        render={() => (
          <FormItem>
            <div>
              <FormLabel className="text-base">Specify mappings</FormLabel>
              {/* <FormDescription>
                Select the items you want to display in the sidebar.
              </FormDescription> */}
            </div>
            {
              fields.map((field, index) => {
                return (
                  <div key={field.id} className="flex gap-2 w-full">
                      <div>
                        <FormField
                          control={form.control}
                          name={`fields.${index}.key`}
                          render={({ field }) => {
                            return (
                              <FormItem
                                className="flex flex-col items-start space-x-0 space-y-1"
                              >
                                <FormControl>
                                  <Input placeholder="Key" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name={`fields.${index}.expression`}
                          render={({ field }) => {
                            return (
                              <FormItem
                                className="flex flex-col items-start space-x-0 space-y-1"
                              >
                                <FormControl>
                                  <Input placeholder="Expression" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ExpressionEditor />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open expression editor</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button onClick={() => remove(index)}><CircleX /></Button>
                      </div>
                  </div>
                )
              })
            }
            <div className="flex justify-end" onClick={() => append({ key: "", expression: "" })}>
              <Button>Add Field</Button>
            </div>
            {!(currentNodeData.fields && currentNodeData.fields.length) && <p className="text-sm text-gray-500">No fields available</p>}
            <FormMessage />
          </FormItem>
        )}
      />
    </ConfigModalBase>
  )
}

export default MapConfigModal