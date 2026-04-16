export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  cached: boolean;
  timestamp: string;
}

export interface ApiClientOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 3;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      undefined,
      true
    );
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.ok || response.status === 404) {
        return response;
      }
      throw new ApiError(`HTTP ${response.status}`, response.status);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  clientOptions: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = clientOptions;

  try {
    const response = await fetchWithRetry(url, { ...options, timeout }, retries);
    const data = await response.json();
    return {
      data,
      error: null,
      cached: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString(),
    };
  }
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined);
  return new URLSearchParams(
    filtered.map(([k, v]) => [k, String(v)])
  ).toString();
}