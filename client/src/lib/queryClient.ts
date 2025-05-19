import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
}

// Define a stable fetch function that won't cause the React Query error
const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // Check if there's a network connection before attempting to fetch
    if (!navigator.onLine) {
      throw new Error("You are offline. Please check your internet connection.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`Fetch request for ${url} timed out`);
      throw new Error("Request timed out. Please try again.");
    }
    
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const res = await safeFetch(url, {
        headers: { "Cache-Control": "no-cache" }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (res.status === 401 && window.location.pathname !== "/") {
        // If unauthorized and not on homepage, redirect to login
        window.location.href = "/api/login";
        return null;
      }

      await throwIfResNotOk(res);
      
      // Special handling for empty responses
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      } else {
        // Handle non-JSON responses gracefully
        return null;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Query fetch error:", error.message);
        
        // Handle network errors more gracefully
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          // Network error - could redirect to an error page or return a standardized error object
          return { error: true, networkError: true, message: "Network connection issue. Please check your internet connection." };
        }
      } else {
        console.error("Unknown query fetch error");
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute stale time instead of Infinity
      retry: 1, // Allow one retry for network issues
    },
    mutations: {
      retry: 1, // Allow one retry for network issues
    },
  },
});
