import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./pages/app"
import Projects from "./pages/projects"
import Project from "./pages/project"
import Connections from "./pages/connections"
import Editor from "./pages/editor"
import { ReactFlowProvider } from "@xyflow/react"

const router = createBrowserRouter([
  {
    path: "/",
    element: <div className="text-3xl font-bold underline">Landing Page!</div>,
  },
  {
    path: "/sign-in",
    element: <div className="text-3xl font-bold underline">Sign In</div>,
  },
  {
    path: "/sign-up",
    element: <div className="text-3xl font-bold underline">Sign Up</div>,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "projects",
        element: <Projects />
      },
      {
        path: "/app/projects/:projectId",
        element: <Project />
      },
      {
        path: "connections",
        element: <Connections />
      }
    ],
  },
  {
    path: "/app/projects/:projectId/pipelines/:pipelineId/editor",
    element: <ReactFlowProvider><Editor /></ReactFlowProvider>
  }
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
