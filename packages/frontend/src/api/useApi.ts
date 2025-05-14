import { useState, useEffect, useMemo } from "react"
import axios, { AxiosInstance } from "axios"
import { Edge, Node } from "@xyflow/react"
import { useAuth0 } from "@auth0/auth0-react"

export interface SchemaField {
  name: string
  dataType: string
}

interface PreviewRequest {
  nodes: Array<Node>
  edges: Array<Edge>
}

interface PreviewResponse {
  incomingSchema: Array<SchemaField>
  schema: Array<SchemaField>
  data: Array<Array<string>>
}

const useApi = () => {
  const [token, setToken] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const { getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    const storedToken = localStorage.getItem("apiToken")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const setApiToken = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem("apiToken", newToken)
  }

  const api: AxiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        "Content-Type": "application/json",
      }
    })

    instance.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        setApiError(error?.response?.data?.message || "Unknown error")
        return Promise.reject(error)
      }
    )

    return instance
  }, [token])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const get = async <T>(url: string, config = {}): Promise<T> => {
    const response = await api.get<T>(url, config)
    return response.data
  }

  const post = async <T>(url: string, data?: unknown, config = {}): Promise<T> => {
    const response = await api.post<T>(url, data, config)
    return response.data
  }

  const endpoints = {
    postPreview: async (data: PreviewRequest): Promise<PreviewResponse> => {
      const accessToken = await getAccessTokenSilently()
      return post("/preview", data, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    }
  }

  return {
    ...endpoints,
    setApiToken,
    apiError
  }
}

export default useApi
