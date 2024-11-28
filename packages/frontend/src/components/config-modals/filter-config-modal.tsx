import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { FilterConfig, FilterConfigConditions, TransformationType } from "../../../../shared/types/transformations"
import { useNodeDataState } from "@/stores/node-store"
import ConfigModalBase from "./config-modal-base"

const formSchema = z.object({
  label: z.string(),
  field: z.string(),
  condition: z.nativeEnum(FilterConfigConditions),
  value: z.string()
})

interface FilterConfigModalProps {
  id: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const FilterConfigModal = ({ id, label, onOpenChange, open } : FilterConfigModalProps) => {
  const {
    useGetNodeData,
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<FilterConfig>(id)

  const form = useForm<z.infer<typeof formSchema> & { type: TransformationType.Filter }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: label,
      condition: currentNodeData?.config?.condition,
      field: currentNodeData?.config?.field,
      value: currentNodeData?.config?.value
    },
  })

  const updateConfig = (values: FilterConfig): FilterConfig => {
    return {
      ...values,
      type: TransformationType.Filter,
    }
  }
  
  return (
    <ConfigModalBase<FilterConfig>
      id={id}
      form={form}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Filter Transformation"
      updateConfig={updateConfig}
    >
      {/* Filter Condition */}
      <div className="flex gap-4 justify-between">
        {/* Field */}
        <div>
          <FormField
            control={form.control}
            name="field"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      currentNodeData.fields && currentNodeData.fields.length && currentNodeData.fields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Condition */}
        <div>
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    { Object.values(FilterConfigConditions).map(condition => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    )) }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Value */}
        <div>
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input placeholder="Value" {...field} />
                </FormControl>
                {/* <FormDescription>
                  Label for node
                </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </ConfigModalBase>
  )
}

export default FilterConfigModal