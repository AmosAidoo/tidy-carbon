import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { BrowserRouter, createBrowserRouter, Route, Routes } from "react-router-dom"
import App from "./pages/app"
import Projects from "./pages/projects"
import Project from "./pages/project"
import Connections from "./pages/connections"
import Editor from "./pages/editor"
import { ReactFlowProvider } from "@xyflow/react"
import { Auth0ProviderWithNavigate } from "./components/auth0-provider-with-navigate"
import LandingPage from "./pages/landing-page"
import { useAuth0 } from "@auth0/auth0-react"
import AuthenticationGuard from "./components/authentication-guard"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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

const AppRoutes = () => {
  const { isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AuthenticationGuard component={App} />}>
          <Route path="projects" element={<AuthenticationGuard component={Projects} />} />
          <Route path="projects/:projectId" element={<AuthenticationGuard component={Project} />} />
          <Route path="connections" element={<AuthenticationGuard component={Connections} />} />
        </Route>
        <Route
          path="/app/projects/:projectId/pipelines/:pipelineId/editor"
          element={
            <AuthenticationGuard component={() => {
              return (
                <ReactFlowProvider>
                  <Editor />
                </ReactFlowProvider>
              )
            }} />
          }
        />
      </Routes>
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <AppRoutes />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>,
)
