import { useForm } from "react-hook-form"
import ConfigModalBase from "./config-modal-base"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNodeDataState } from "@/stores/node-store"
import { SelectConfig, TransformationType } from "../../../../shared/types/transformations"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Checkbox } from "../ui/checkbox"

const formSchema = z.object({
  label: z.string(),
  fields: z.array(z.string())
})

interface SelectConfigModalProps {
  id: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const SelectConfigModal = ({ id, label, onOpenChange, open } : SelectConfigModalProps) => {
  const {
    useGetNodeData,
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<SelectConfig>(id)

  const form = useForm<z.infer<typeof formSchema> & { type: TransformationType.Select }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: label,
      fields: currentNodeData.config?.fields || []
    },
  })

  const updateConfig = (values: SelectConfig): SelectConfig => {
    return {
      ...values,
      type: TransformationType.Select,
    }
  }
  
  return (
    <ConfigModalBase<SelectConfig>
      id={id}
      form={form}
      onOpenChange={onOpenChange}
      open={open}
      title="Edit Select Transformation"
      updateConfig={updateConfig}
    >
      <FormField
        control={form.control}
        name="fields"
        render={() => (
          <FormItem>
            <div>
              <FormLabel className="text-base">Select Fields</FormLabel>
              {/* <FormDescription>
                Select the items you want to display in the sidebar.
              </FormDescription> */}
            </div>
            {currentNodeData.fields && currentNodeData.fields.length && currentNodeData.fields.map((item) => (
              <FormField
                key={item}
                control={form.control}
                name="fields"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={item}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, item])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {item}
                      </FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
            {!(currentNodeData.fields && currentNodeData.fields.length) && <p className="text-sm text-gray-500">No fields available</p>}
            <FormMessage />
          </FormItem>
        )}
      />
    </ConfigModalBase>
  )
}

export default SelectConfigModal