const PRODUCT_SERVICE_URL =
  import.meta.env.VITE_PRODUCT_SERVICE_URL || "http://localhost:8003";

const AUTH_SERVICE_URL =
  import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:8001";

// ---------- API Types ----------

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ---------- Shared HTTP Client ----------

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    let message = errorText || `Request failed with status ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the original response text if it is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ---------- Product API ----------

export const productApi = {
  get<T>(path: string) {
    return request<T>(PRODUCT_SERVICE_URL, path, {
      method: "GET",
    });
  },

  post<T>(path: string, body?: unknown) {
    return request<T>(PRODUCT_SERVICE_URL, path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown) {
    return request<T>(PRODUCT_SERVICE_URL, path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>(PRODUCT_SERVICE_URL, path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return request<T>(PRODUCT_SERVICE_URL, path, {
      method: "DELETE",
    });
  },
};

// ---------- Authentication API ----------

export const authApi = {
  register(body: RegisterRequest) {
    return request<AuthUser>(
      AUTH_SERVICE_URL,
      "/api/v1/auth/register",
      {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
      }
    );
  },

  login(body: LoginRequest) {
    return request<TokenResponse>(
      AUTH_SERVICE_URL,
      "/api/v1/auth/login",
      {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
      }
    );
  },

  me(accessToken: string) {
    return request<Record<string, unknown>>(
      AUTH_SERVICE_URL,
      "/api/v1/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  refresh() {
    return request<TokenResponse>(
      AUTH_SERVICE_URL,
      "/api/v1/auth/refresh",
      {
        method: "POST",
        credentials: "include",
      }
    );
  },

  logout() {
    return request<{ message: string }>(
      AUTH_SERVICE_URL,
      "/api/v1/auth/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );
  },
};