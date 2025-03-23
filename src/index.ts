import { reactive, UnwrapRef } from "vue";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

interface RequestState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

export class VueRequest {
  private baseURL: string;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  private buildUrl(url: string, params?: Record<string, string>): string {
    if (!params) return url;

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    return `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;
  }

  async request<T>(url: string = "", options: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body = null, params } = options;
    const fullURL = this.buildUrl(this.baseURL + url, params);

    try {
      const response = await fetch(fullURL, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Vuexi error ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      }
    } catch (error) {
      console.error(`Request failed: ${error}`);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  useRequest<T>(url: string = "", options: RequestOptions = {}) {
    const state = reactive<RequestState<T>>({
      loading: false,
      error: null,
      data: null,
    });

    const execute = async (): Promise<T | null> => {
      state.loading = true;
      state.error = null;

      try {
        const result = await this.request<T>(url, options);
        state.data = result as unknown as UnwrapRef<T>;
        return result;
      } catch (error) {
        state.error = error instanceof Error ? error : new Error(String(error));
        return null;
      } finally {
        state.loading = false;
      }
    };

    execute();

    return {
      state,
      execute,
    };
  }

  get<T>(
    url: string,
    params?: Record<string, string>,
    headers?: Record<string, string>
  ) {
    return this.request<T>(url, { method: "GET", headers, params });
  }

  post<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "POST", body, headers });
  }

  put<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "PUT", body, headers });
  }

  delete<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "DELETE", headers });
  }

  patch<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "PATCH", body, headers });
  }

  useGet<T>(
    url: string,
    params?: Record<string, string>,
    headers?: Record<string, string>
  ) {
    return this.useRequest<T>(url, { method: "GET", headers, params });
  }

  usePost<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.useRequest<T>(url, { method: "POST", body, headers });
  }

  usePut<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.useRequest<T>(url, { method: "PUT", body, headers });
  }

  useDelete<T>(url: string, headers?: Record<string, string>) {
    return this.useRequest<T>(url, { method: "DELETE", headers });
  }

  usePatch<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.useRequest<T>(url, { method: "PATCH", body, headers });
  }
}
