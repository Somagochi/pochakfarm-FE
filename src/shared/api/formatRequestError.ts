export function formatRequestError(_requestLabel: string, error: unknown) {
  return error instanceof Error
    ? error.message
    : '알 수 없는 오류가 발생했습니다.';
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
