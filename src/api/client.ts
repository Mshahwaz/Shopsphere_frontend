const PRODUCT_SERVICE_URL =
  import.meta.env.VITE_PRODUCT_SERVICE_URL || "http://localhost:8003";

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

    throw new Error(
      errorText || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

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