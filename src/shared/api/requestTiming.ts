export type ApiRequestTiming = {
  setup_ms: number | null;
  auth_ms: number | null;
  fetch_ms: number | null;
  refresh_ms: number | null;
  retry_ms: number | null;
  json_ms: number | null;
  postprocess_ms: number | null;
  total_ms: number;
  initial_status: number | null;
  final_status: number | null;
  token_refresh_attempted: boolean;
};

const PHASES = [
  'setup_ms',
  'auth_ms',
  'fetch_ms',
  'refresh_ms',
  'retry_ms',
  'json_ms',
  'postprocess_ms',
] as const;
type RequestTimingPhase = (typeof PHASES)[number];

export function createRequestTiming(
  onTiming: (timing: ApiRequestTiming) => void,
) {
  const startedAt = performance.now();
  let currentPhase: RequestTimingPhase = 'setup_ms';
  let phaseStartedAt = startedAt;
  let hasCompleted = false;
  const timing: ApiRequestTiming = {
    setup_ms: null,
    auth_ms: null,
    fetch_ms: null,
    refresh_ms: null,
    retry_ms: null,
    json_ms: null,
    postprocess_ms: null,
    total_ms: 0,
    initial_status: null,
    final_status: null,
    token_refresh_attempted: false,
  };

  function endCurrentPhase(now: number) {
    timing[currentPhase] = (timing[currentPhase] ?? 0) + now - phaseStartedAt;
  }

  function startPhase(nextPhase: RequestTimingPhase) {
    if (hasCompleted || nextPhase === currentPhase) return;

    const now = performance.now();
    endCurrentPhase(now);
    currentPhase = nextPhase;
    phaseStartedAt = now;
  }

  function complete() {
    if (hasCompleted) return;

    const now = performance.now();
    endCurrentPhase(now);
    hasCompleted = true;
    const report = { ...timing, total_ms: Math.round(now - startedAt) };
    PHASES.forEach((phase) => {
      const duration = report[phase];
      if (duration !== null) report[phase] = Math.round(duration);
    });

    try {
      onTiming(report);
    } catch {
      // 측정 로그의 실패가 원래 API 응답이나 오류를 바꾸지 않게 합니다.
    }
  }

  return { timing, startPhase, complete };
}
