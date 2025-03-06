import { onMounted, onUnmounted, ref } from "vue";

const cache = new Map<string, any>();

export function useLazyFetch<T>(
  url: string,
  fetchOptions?: RequestInit,
  options: {
    cache?: boolean;
    refetchOnFocus?: boolean;
    interval?: number;
  } = {}
) {
  const data = ref<T | null>();
  const isLoading = ref<boolean>(false);
  const error = ref<Error | null>(null);

  async function fetchData() {
    isLoading.value = true;

    try {
      if (options.cache && cache.has(url)) {
        data.value = cache.get(url);
      } else {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) throw new Error("Loading error");
        const result = await response.json();
        data.value = result;

        cache.set(url, result);
      }
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      console.log("test");
      fetchData();
    }
  }

  onMounted(() => {
    fetchData();
    if (options.refetchOnFocus) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  });

  onUnmounted(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  if (options.interval) {
    const intervalId = setInterval(fetchData, options.interval);
    onUnmounted(() => intervalId && clearInterval(intervalId));
  }

  return { data, isLoading, error, refresh: fetchData };
}
