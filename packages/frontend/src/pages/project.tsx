import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Link } from "react-router-dom"

// A project is made up of multiple things
// For now, a project only has data transformation pipelines
const Project = () => {
  return (
    <div className="h-full p-4">
      <h3 className="text-lg font-normal">Pipelines</h3>

      <div className="grid grid-cols-4 gap-4 mt-2">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Pipeline Name</CardTitle>
            <CardDescription>Pipeline Description</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to={`pipelines/pipelineId/editor`}>
              <Button>Open Editor</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Project