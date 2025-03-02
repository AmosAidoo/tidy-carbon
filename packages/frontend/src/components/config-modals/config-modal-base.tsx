import { PropsWithChildren, useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { NodeDataLoadingState, useNodeDataState } from "@/stores/node-store"
import { useNodes, useEdges, useReactFlow } from "@xyflow/react"
import { TransformationConfig } from "../../../../shared/types/transformations"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Path, UseFormReturn } from "react-hook-form"
import { Loader2, Save } from "lucide-react"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

type FormFieldValues<T extends TransformationConfig> = T & { label: string }

interface ModalBaseProps<T extends TransformationConfig> {
  id: string
  title: string
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<FormFieldValues<T>, any, undefined>
  updateConfig: (values: T) => T
  onOpenChange?: (open: boolean) => void
}

const ConfigModalBase = <T extends TransformationConfig>({
  id,
  title, 
  open, 
  onOpenChange,
  updateConfig,
  form,
  children 
}: PropsWithChildren<ModalBaseProps<T>>) => {
  const [saving, setSaving] = useState(false)

  const nodes = useNodes()
  const edges = useEdges()

  const {
    useGetNodeData,
    setNodeData,
    evaluateUpstreamNodes
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<T>(id)

  const { updateNodeData } = useReactFlow()

  const refreshNodeState = useCallback(() => {
    evaluateUpstreamNodes(id, nodes, edges)
  }, [edges, evaluateUpstreamNodes, id, nodes])
  

  useEffect(() => {
    if (open) {
      refreshNodeState()
    }
  }, [open])

  function onSubmit(values: FormFieldValues<T>) {
    setSaving(true)
    setNodeData(id, {
      ...currentNodeData,
      config: updateConfig(values),
    })
    updateNodeData(id, { label: values.label })
    setSaving(false)
    refreshNodeState()
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => { e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="w-full overflow-x-scroll px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Label */}
              <FormField
                control={form.control}
                name={"label" as Path<FormFieldValues<T>>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Label" {...field} value={field.value as string} />
                    </FormControl>
                    {/* <FormDescription>
                      Label for node
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              { children }

              {/* Preview */}
              <div>
                <div className="flex justify-between">
                  <h3>Data Preview</h3>
                  { currentNodeData?.loadingState == NodeDataLoadingState.Processing && <Loader2 className="animate-spin" /> }
                </div>
                    
                <div>
                    {
                      currentNodeData?.data && currentNodeData.data.length ?
                        (
                          <Table>
                              {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
                              <TableHeader>
                                <TableRow>
                                  {
                                    Object.keys(currentNodeData.data[0] as never).map(col => (
                                      <TableHead key={col} className="">{col}</TableHead>
                                    ))
                                  }
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {
                                  currentNodeData?.data.slice(0,10).map((item, idx) => (
                                    <TableRow key={idx}>
                                      {
                                        Object.values(item as never).map(value => (
                                          <TableCell key={value as never} className="font-medium">{value as never}</TableCell>
                                        ))
                                      }
                                    </TableRow>
                                  ))
                                }
                              </TableBody>
                              <TableFooter>
                                <TableRow>
                                </TableRow>
                              </TableFooter>
                            </Table>
                        ):
                        (
                          <p className="text-sm text-gray-500">No data available</p>
                        )
                    }
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  { saving ? <Loader2 className="animate-spin" /> : <Save /> }
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigModalBase