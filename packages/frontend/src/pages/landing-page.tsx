import { Button } from "@/components/ui/button"
import { useAuth0 } from "@auth0/auth0-react"
import { Link } from "react-router-dom"

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0()

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/app",
      },
      authorizationParams: {
        screen_hint: "signup",
      },
    })
  }

  return (
    <Button onClick={handleLogin}>
      Log In
    </Button>
  )
}

export const LogoutButton = () => {
  const { logout } = useAuth0()

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
  }

  return (
    <Button onClick={handleLogout}>
      Log Out
    </Button>
  )
}

const LandingPage = () => {
  const { isAuthenticated } = useAuth0()
  return (
    <>
      <div className="text-3xl font-bold underline">Landing Page!</div>
      <div>
        {!isAuthenticated && (
          <>
            <LoginButton />
          </>
        )}
        {isAuthenticated && (
          <>
            <LogoutButton />
            <Link to="app">
              <Button variant="secondary">Go to app</Button>
            </Link>
          </>
        )}
      </div>
    </>
  )
}

export default LandingPage