import { env } from '@/src/shared/config/env';

type RequestOptions = {
  headers?: Record<string, string>;
};

async function request<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : 'API 요청에 실패했습니다.';

    throw new Error(message);
  }

  return data as TResponse;
}

export const apiClient = {
  post<TResponse, TBody extends object>(path: string, body: TBody, options: RequestOptions = {}) {
    return request<TResponse>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  },
};

