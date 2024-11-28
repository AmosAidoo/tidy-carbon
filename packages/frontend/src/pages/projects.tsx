import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Link } from "react-router-dom"

const Projects = () => {
  return (
    <div className="h-full p-4">
      <h3 className="text-lg font-normal">Projects</h3>

      <div className="grid grid-cols-4 gap-4 mt-2">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle>Project Name</CardTitle>
            <CardDescription>Project Description</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to={`projectId`}>
              <Button>View Project</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Projects