import { useCallback, useLayoutEffect, useRef } from 'react';

import type { CaptureThrowResult } from './types';

export function useCaptureGameResultCallback(
  onGameResult: (throws: CaptureThrowResult[]) => void,
) {
  const callbackRef = useRef(onGameResult);

  useLayoutEffect(() => {
    callbackRef.current = onGameResult;
  }, [onGameResult]);

  // 부모 렌더링으로 타이머를 재시작하지 않으며 최신 결과 핸들러를 호출합니다.
  return useCallback((throws: CaptureThrowResult[]) => {
    callbackRef.current(throws);
  }, []);
}
