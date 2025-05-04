import { useFieldArray, useForm, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import classNames from "classnames"
import { FormField, FormItem, FormControl, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { FilterConfig, FilterConfigConditions, FilterGroupOperator, TransformationType } from "../../../../shared/types/transformations"
import { useNodeDataState } from "@/stores/node-store"
import ConfigModalBase, { FormFieldValues } from "./config-modal-base"
import { Button } from "../ui/button"

const filterRuleSchema = z.object({
  type: z.literal("Rule"),
  field: z.string(),
  condition: z.nativeEnum(FilterConfigConditions),
  value: z.string(),
})

const baseFilterGroupSchema = z.object({
  type: z.literal("Group"),
  operator: z.nativeEnum(FilterGroupOperator),
})

type FilterRule = z.infer<typeof filterRuleSchema>

type FilterGroup = z.infer<typeof baseFilterGroupSchema> & {
  conditions: (FilterRule | FilterGroup)[]
}

const filterGroupSchema: z.ZodType<FilterGroup> = baseFilterGroupSchema.extend({
  conditions: z.lazy(() => z.union([filterRuleSchema, filterGroupSchema]).array())
})

const formSchema = z.object({
  label: z.string(),
  rules: filterGroupSchema
})

interface FilterConfigModalProps {
  id: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

interface FilterGroupEditorProps {
  id: string // Node id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<FormFieldValues<FilterConfig>, any, undefined>,
  name: string // e.g. rules.conditions.0
  remove?: (i: number) => void
  index?: number
}

const FilterGroupEditor = ({ id, name, form, remove, index }: FilterGroupEditorProps) => {
  const { useGetNodeData } = useNodeDataState()
  const currentNodeData = useGetNodeData<FilterConfig>(id)

  const { fields, append, remove: fRemove } = useFieldArray({
    control: form.control,
    name: `${name}.conditions` as "rules.conditions" | `rules.conditions.${number}.${string}`,
  })

  const isRootGroup = name === "rules"

  return (
    <div className={classNames("space-y-4", { "ml-4": !isRootGroup })}>
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Group</p>
        {!isRootGroup && remove && typeof index === "number" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="text-red-500"
          >
            x
          </Button>
        )}
      </div>

      {/* Operator */}
      <FormField
        control={form.control}
        name={`${name}.operator`}
        render={({ field }) => (
          <FormItem>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Conditions: group siblings inline */}
      <div className="grid gap-2 pr-2">
        {fields.map((field, index) => {
          const conditionPath = `${name}.conditions.${index}`

          if (field.type === "Group") {
            return (
              <div key={field.id} className="border-l-2 pl-4 border-muted bg-background shadow-sm rounded-md py-2">
                <FilterGroupEditor
                  id={id}
                  name={conditionPath}
                  form={form}
                  index={index}
                  remove={fRemove}
                />
              </div>
            )
          }

          return (
            <div
              key={field.id}
              className="grid grid-cols-4 gap-2 items-end"
            >
              {/* Field */}
              <FormField
                control={form.control}
                name={`${conditionPath}.field`}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentNodeData.incomingFields?.map((f) => (
                          <SelectItem key={f.name} value={f.name}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Condition */}
              <FormField
                control={form.control}
                name={`${conditionPath}.condition`}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FilterConfigConditions).map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Value */}
              <FormField
                control={form.control}
                name={`${conditionPath}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => fRemove(index)}
                className="text-red-500"
              >
                x
              </Button>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              type: "Rule",
              field: "",
              condition: FilterConfigConditions.Equals,
              value: "",
            })
          }
        >
          Add Rule
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              type: "Group",
              operator: FilterGroupOperator.AND,
              conditions: [],
            })
          }
        >
          Add Group
        </Button>
      </div>
    </div>
  )
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
      rules: currentNodeData?.config?.rules
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
      {/* Rules */}
      <FilterGroupEditor id={id} form={form} name="rules" />
    </ConfigModalBase>
  )
}

export default FilterConfigModal