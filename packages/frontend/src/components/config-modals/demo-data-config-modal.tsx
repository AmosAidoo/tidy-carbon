import { useNodeDataState } from "@/stores/node-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table"

interface DemoDataConfigModalProps {
  id: string
  title: string
  label: string
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const DemoDataConfigModal = ({ open, title, onOpenChange, id }: DemoDataConfigModalProps) => {
  const { useGetNodeData } = useNodeDataState()

  const data = useGetNodeData(id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => { e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>Edit {title} transformation</DialogTitle>
        </DialogHeader>

        <div className="w-full overflow-x-scroll">
          {/* Preview */}
          <div>
            <div className="flex justify-between">
              <h3>Data Preview</h3>
            </div>
                
            <div>
                {
                  data?.data && data.data.length ?
                    (
                      <Table>
                          <TableCaption>A list of your recent invoices.</TableCaption>
                          <TableHeader>
                            <TableRow>
                              {
                                Object.keys(data.data[0] as never).map(col => (
                                  <TableHead key={col} className="">{col}</TableHead>
                                ))
                              }
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {
                              data?.data.slice(0,10).map((item, idx) => (
                                <TableRow key={idx}>
                                  {
                                    Object.values(item).map(value => (
                                      <TableCell key={value} className="font-medium">{value}</TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DemoDataConfigModal