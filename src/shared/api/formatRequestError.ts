import { ApiError } from './client';

export function formatRequestError(requestLabel: string, error: unknown) {
  const message =
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  if (error instanceof ApiError) {
    const status = `HTTP ${error.status}`;
    const code = error.code ? ` · ${error.code}` : '';

    return `[${requestLabel}]\n${status}${code}\n${message}`;
  }

  return `[${requestLabel}]\n${message}`;
}

export async function runRequestStep<TResult>(
  requestLabel: string,
  request: () => Promise<TResult>,
) {
  try {
    return await request();
  } catch (error) {
    console.error(`[${requestLabel}]`, error);
    throw new Error(formatRequestError(requestLabel, error));
  }
}
