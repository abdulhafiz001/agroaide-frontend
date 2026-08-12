const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredApiBaseUrl) {
  // Failing early avoids silent networking bugs across platforms.
  throw new Error('Missing EXPO_PUBLIC_API_URL. Set it in AgroAide-frontend/.env');
}
const API_BASE_URL = configuredApiBaseUrl;

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function isDeviceOffline(): Promise<boolean> {
  try {
    const NetInfo = (await import('@react-native-community/netinfo')).default;
    const state = await NetInfo.fetch();
    return !(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  timeoutMs?: number;
};

const REQUEST_TIMEOUT_MS = 30000; // 30s - general timeout; dashboard snapshot is fast (weather only, AI loads separately)

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeoutMs } = options;
  let response: Response;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), timeoutMs ?? REQUEST_TIMEOUT_MS);

    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timeoutId);
  } catch (err: unknown) {
    if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId);
    const host = new URL(API_BASE_URL).hostname;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const isLocalHost = ['127.0.0.1', 'localhost'].includes(host);
    const offline = await isDeviceOffline();

    let hint: string;
    if (offline) {
      hint = 'You are not connected to the internet. Check your mobile data or Wi‑Fi and try again.';
    } else if (isTimeout) {
      hint = 'The request timed out. Please try again in a moment.';
    } else if (isLocalHost) {
      hint =
        'Cannot reach the local backend. On a physical device, set EXPO_PUBLIC_API_URL to your computer LAN IP. For Android emulator use http://10.0.2.2:8000/api.';
    } else {
      hint = 'Cannot reach AgroAide right now. Please try again shortly.';
    }
    throw new ApiError(hint, 0);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; errors?: Record<string, string[]> } | null;
    const validationMessage = payload?.errors ? Object.values(payload.errors).flat()[0] : undefined;
    const fallback =
      response.status === 400
        ? 'Bad request. Check your API URL / server host settings and try again.'
        : 'Request failed.';
    throw new ApiError(validationMessage ?? payload?.message ?? fallback, response.status);
  }

  return (await response.json()) as T;
}
