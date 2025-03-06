import exp from "constants";
import { reactive } from "vue";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

interface RequestState<T> {
  loading?: boolean;
  error?: Error | null;
  data?: T | null;
}

class Vuexi {
  private baseURL: string;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  async request<T>(url?: string, options: RequestOptions = { method: "GET" }) {
    const fullURL = url ? this.baseURL + url : this.baseURL;

    try {
      const response = await fetch(fullURL, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : null,
      });
      if (!response.ok) throw new Error(`Vuexi error: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error(`Request failed: ${error}`);
      throw error;
    }
  }

  useRequest<T>(url?: string, options: RequestOptions = {}) {
    const state = reactive<RequestState<T>>({
      loading: false,
      error: null,
      data: null,
    });

    const execute = async () => {
      state.loading = true;
      try {
        const result = await this.request<T>(url, options);
        state.data = result;
      } catch (error) {
        state.error = error as Error;
      } finally {
        state.loading = false;
      }
    };

    execute();

    return {
      ...state,
      execute,
    };
  }

  get<T>(url?: string, headers?: Record<string, string>) {
    return this.useRequest<T>(url, { method: "GET", headers });
  }

  post<T>(url: string, body: any, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "POST", body, headers });
  }

  put<T>(url: string, body: any, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "PUT", body, headers });
  }

  delete<T>(url: string, headers?: Record<string, string>) {
    return this.request<T>(url, { method: "DELETE", headers });
  }
}

export { Vuexi };
