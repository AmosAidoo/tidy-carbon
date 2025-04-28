import { PropsWithChildren, useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { NodeDataLoadingState, useNodeDataState } from "@/stores/node-store"
import { useReactFlow } from "@xyflow/react"
import { TransformationConfig } from "../../../../shared/types/transformations"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Path, UseFormReturn } from "react-hook-form"
import { Loader2, Save } from "lucide-react"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useEditorState } from "@/stores/editor-store"

import useApi from "@/api/useApi"

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

  const api = useApi()

  const {
    useGetNodeData,
    setNodeData,
  } = useNodeDataState()

  const currentNodeData = useGetNodeData<T>(id)

  const { updateNodeData } = useReactFlow()

  const {
    getUpstreamSubgraph
  } = useEditorState()

  const refreshNodeState = useCallback(async (config: T) => {
    let previewData: Record<string, string>[] = []
    let previewFields: string[] = []
    let incomingFields: string[] = []
    const upstreamSubgraph = getUpstreamSubgraph(id)
    if (upstreamSubgraph) {
      setNodeData(id, {
        ...currentNodeData,
        loadingState: NodeDataLoadingState.Processing
      })
      const idx = upstreamSubgraph.nodes.findIndex(node => node.id == id)
      upstreamSubgraph.nodes[idx].config = config
      try {
        const response = await api.postPreview(upstreamSubgraph)
        const { incomingSchema, schema, data } = response
        previewData = data.map(row => {
          const obj: Record<string, string> = {}
          schema.forEach((field, index) => {
            obj[field.name] = row[index]
          })
          return obj
        })
        previewFields = schema.map(field => field.name)
        incomingFields = incomingSchema.map(field => field.name)
        setNodeData(id, {
          ...currentNodeData,
          loadingState: NodeDataLoadingState.Done
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setNodeData(id, {
          ...currentNodeData,
          loadingState: NodeDataLoadingState.Error
        })
        alert("an error occured " + err.message)
      }
    }
    return { previewFields, incomingFields, previewData }
  }, [api, getUpstreamSubgraph, id])
  

  useEffect(() => {
    async function doRefreshNodeState() {
      if (open && currentNodeData.isStale && currentNodeData.config) {
        const newState = await refreshNodeState(currentNodeData.config)
        setNodeData(id, {
          ...currentNodeData,
          incomingFields: newState.incomingFields,
          data: newState.previewData,
          fields: newState.previewFields,
          isStale: false
        })
      }
    }
    doRefreshNodeState()
  }, [open])

  async function onSubmit(values: FormFieldValues<T>) {
    setSaving(true)
    const newConfig = updateConfig(values)
    const newState = await refreshNodeState(newConfig)
    setNodeData(id, {
      ...currentNodeData,
      incomingFields: newState.incomingFields,
      data: newState.previewData, // Might need some more error proof handling
      fields: newState.previewFields, // Might need some more error proof handling
      config: newConfig,
      isStale: false
    })
    // Should this fail if call to refreshNodeState
    // fails? Probably yes
    updateNodeData(id, { label: values.label })
    setSaving(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => { e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div>
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
                      <Input placeholder="Label" {...field} />
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
              <div className="">
                <div className="flex justify-between">
                  <h3>Data Preview</h3>
                  { currentNodeData?.loadingState == NodeDataLoadingState.Processing && <Loader2 className="animate-spin" /> }
                </div>
                    
                <div>
                    {
                      currentNodeData?.data && currentNodeData.data.length ?
                        (
                          <Table className="overflow-auto">
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