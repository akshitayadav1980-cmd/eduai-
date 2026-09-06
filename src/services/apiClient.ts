/**
 * Central API Client for Vernacular AI frontend.
 *
 * - Uses native `fetch` (no external dependencies).
 * - In development: routes via Vite dev proxy to `/api/v1/...`.
 * - In production: prepends VITE_API_URL (e.g. https://eduai-swe0.onrender.com)
 *   so requests reach the live FastAPI backend instead of the Netlify origin.
 * - Reads/writes JWT access token in `localStorage`.
 * - Automatically attaches `Authorization: Bearer <token>` when available.
 * - Parses JSON responses and handles HTTP errors cleanly.
 * - SECURITY: Never logs tokens, passwords, or secret payloads.
 */

const TOKEN_STORAGE_KEY = 'vernacular_token'

// In dev, VITE_API_URL is unset so requests go to '' (relative) and the
// Vite proxy forwards /api/v1/... to localhost:8001.
// In production, set VITE_API_URL=https://eduai-swe0.onrender.com in Netlify
// environment variables so the browser sends requests to the live backend.
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const API_BASE = `${API_ORIGIN}/api/v1`

export interface ApiErrorDetail {
  status: number
  message: string
  detail?: any
}

export class ApiError extends Error {
  status: number
  detail: any

  constructor(status: number, message: string, detail?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

// ── Token Management ─────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch (err) {
    console.error('Failed to save authentication token to localStorage.')
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear authentication token from localStorage.')
  }
}

// ── Core Request Dispatcher ──────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...restOptions } = options

  // Normalize endpoint to start with /api/v1
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  if (!path.startsWith('/api/v1')) {
    path = `${API_BASE}${path}`
  }

  // Append query params if any
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      path += (path.includes('?') ? '&' : '?') + queryString
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  // If sending a body that isn't FormData, default to application/json
  if (restOptions.body && !(restOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Attach Authorization token if available
  const token = getStoredToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Merge custom headers
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, customHeaders)
    }
  }

  const response = await fetch(path, {
    ...restOptions,
    headers,
  })

  // Handle empty 204 response
  if (response.status === 204) {
    return {} as T
  }

  // Try to parse JSON response
  let data: any = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    try {
      data = await response.text()
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        message = data.detail
      } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg
      } else if (data.message) {
        message = data.message
      }
    }
    throw new ApiError(response.status, message, data)
  }

  return data as T
}

// ── HTTP Method Helpers ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' })
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  },
}
