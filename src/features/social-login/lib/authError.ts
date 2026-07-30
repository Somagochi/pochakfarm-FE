export class AuthCancelledError extends Error {
  constructor(message = '로그인이 취소되었습니다.') {
    super(message);
    this.name = 'AuthCancelledError';
  }
}

export function isAuthCancelledError(error: unknown) {
  if (error instanceof AuthCancelledError) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('user cancelled') ||
    normalizedMessage.includes('user canceled')
  );
}
