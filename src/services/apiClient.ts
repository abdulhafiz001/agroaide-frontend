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

    let hint: string;
    if (isTimeout) {
      hint = 'Request timed out. The dashboard loads weather and AI data—it can take 20–30 seconds on first load. Try again.';
    } else if (isLocalHost) {
      hint = 'Cannot reach backend. On a physical device, set EXPO_PUBLIC_API_URL to your computer LAN IP (e.g. http://192.168.x.x:8000/api). For Android emulator use http://10.0.2.2:8000/api.';
    } else {
      hint =
        'Cannot reach backend API. Check: (1) Backend is running: php artisan serve --host=0.0.0.0 --port=8000. ' +
        '(2) Windows Firewall allows port 8000—run allow-firewall.bat as Administrator. (3) Device and computer are on the same WiFi.';
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
