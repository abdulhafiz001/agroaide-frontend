const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!API_BASE_URL) {
  // Failing early avoids silent networking bugs across platforms.
  throw new Error('Missing EXPO_PUBLIC_API_URL. Set it in AgroAide-frontend/.env');
}

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
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  let response: Response;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
    clearTimeout(timeout);
  } catch {
    const host = new URL(API_BASE_URL).hostname;
    const localhostHosts = ['127.0.0.1', 'localhost'];
    const connectivityHint = localhostHosts.includes(host)
      ? 'Cannot reach backend API. If you are testing on a phone, set EXPO_PUBLIC_API_URL to your computer LAN IP (e.g. http://192.168.x.x:8000/api). For Android emulator use http://10.0.2.2:8000/api.'
      : 'Cannot reach backend API. Confirm backend server is running and your API URL is correct.';
    throw new ApiError(connectivityHint, 0);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; errors?: Record<string, string[]> } | null;
    const validationMessage = payload?.errors ? Object.values(payload.errors).flat()[0] : undefined;
    throw new ApiError(validationMessage ?? payload?.message ?? 'Request failed.', response.status);
  }

  return (await response.json()) as T;
}
