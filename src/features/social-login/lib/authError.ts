export class AuthCancelledError extends Error {
  constructor(message = '로그인이 취소되었습니다.') {
    super(message);
    this.name = 'AuthCancelledError';
  }
}

export function isAuthCancelledError(error: unknown) {
  return error instanceof AuthCancelledError;
}

