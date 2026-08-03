import { env } from '@/src/shared/config/env';
import {
  getServiceToken,
  saveServiceToken,
  type ServiceToken,
} from '@/src/shared/lib/auth/tokenStorage';

type RequestOptions = {
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const LOGIN_PATH = '/api/auth/login';
const REFRESH_PATH = '/api/auth/refresh';
let refreshRequest: Promise<ServiceToken> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(data: unknown) {
  if (!isRecord(data)) {
    return null;
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if (
    'data' in data &&
    typeof data.data === 'object' &&
    data.data !== null &&
    'message' in data.data &&
    typeof data.data.message === 'string'
  ) {
    return data.data.message;
  }

  return null;
}

function getTokenContainer(data: unknown) {
  if (!isRecord(data)) {
    return null;
  }

  const responseData = isRecord(data.data) ? data.data : data;

  return isRecord(responseData.token) ? responseData.token : responseData;
}

function parseRefreshedToken(
  data: unknown,
  currentRefreshToken: string,
): ServiceToken {
  const token = getTokenContainer(data);

  if (!token || typeof token.accessToken !== 'string') {
    throw new Error('토큰 재발급 응답이 올바르지 않습니다.');
  }

  return {
    accessToken: token.accessToken,
    refreshToken:
      typeof token.refreshToken === 'string'
        ? token.refreshToken
        : currentRefreshToken,
  };
}

async function parseResponse(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

async function refreshServiceToken() {
  const currentToken = await getServiceToken();

  if (!currentToken) {
    throw new Error('로그인 정보가 없습니다.');
  }

  const response = await fetch(`${env.apiBaseUrl}${REFRESH_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: currentToken.refreshToken,
    }),
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data) ?? '토큰을 재발급하지 못했습니다.',
    );
  }

  const refreshedToken = parseRefreshedToken(
    data,
    currentToken.refreshToken,
  );
  await saveServiceToken(refreshedToken);

  return refreshedToken;
}

function getRefreshedToken() {
  if (!refreshRequest) {
    refreshRequest = refreshServiceToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

async function withAccessToken(path: string, init: RequestInit) {
  if (path === LOGIN_PATH || path === REFRESH_PATH) {
    return init;
  }

  const token = await getServiceToken();

  if (!token) {
    return init;
  }

  return {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token.accessToken}`,
    },
  };
}

async function retryWithAccessToken(
  path: string,
  init: RequestInit,
  accessToken: string,
) {
  return fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function request<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const authenticatedInit = await withAccessToken(path, init);
  let response = await fetch(
    `${env.apiBaseUrl}${path}`,
    authenticatedInit,
  );

  if (
    response.status === 401 &&
    path !== LOGIN_PATH &&
    path !== REFRESH_PATH
  ) {
    const refreshedToken = await getRefreshedToken();
    response = await retryWithAccessToken(
      path,
      init,
      refreshedToken.accessToken,
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = getErrorMessage(data) ?? 'API 요청에 실패했습니다.';

    throw new ApiError(message, response.status);
  }

  return data as TResponse;
}

export const apiClient = {
  delete<TResponse>(path: string, options: RequestOptions = {}) {
    return request<TResponse>(path, {
      method: 'DELETE',
      headers: options.headers,
    });
  },
  get<TResponse>(path: string, options: RequestOptions = {}) {
    return request<TResponse>(path, {
      method: 'GET',
      headers: options.headers,
    });
  },
  post<TResponse, TBody extends object>(
    path: string,
    body: TBody,
    options: RequestOptions = {},
  ) {
    return request<TResponse>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  },
  postWithoutBody<TResponse>(path: string, options: RequestOptions = {}) {
    return request<TResponse>(path, {
      method: 'POST',
      headers: options.headers,
    });
  },
  patch<TResponse, TBody extends object>(
    path: string,
    body: TBody,
    options: RequestOptions = {},
  ) {
    return request<TResponse>(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  },
};
