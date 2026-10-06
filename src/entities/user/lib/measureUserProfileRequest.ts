import { env } from '@/src/shared/config/env';

let runId: string | null = null;
let totalCalls = 0;
let completedCalls = 0;
let failedCalls = 0;
let activeCalls = 0;
let totalCallDurationMs = 0;

export async function measureUserProfileRequest<T>(
  request: () => Promise<T>,
): Promise<T> {
  if (!env.measureUserProfileRequests) {
    return request();
  }

  runId ??= new Date().toISOString();
  const callId = ++totalCalls;
  const startedAt = performance.now();
  activeCalls += 1;
  let outcome: 'succeeded' | 'failed' = 'succeeded';

  console.info(
    '[profile-api:start]',
    JSON.stringify({
      run_id: runId,
      call_id: callId,
      total_calls: totalCalls,
      active_calls: activeCalls,
    }),
  );

  try {
    return await request();
  } catch (error) {
    outcome = 'failed';
    failedCalls += 1;
    throw error;
  } finally {
    const durationMs = performance.now() - startedAt;
    totalCallDurationMs += durationMs;
    completedCalls += 1;
    activeCalls -= 1;

    // 병렬 호출의 시간도 합산되므로 화면 진입 시간과는 다른 지표입니다.
    console.info(
      '[profile-api:complete]',
      JSON.stringify({
        run_id: runId,
        call_id: callId,
        outcome,
        duration_ms: Math.round(durationMs),
        total_calls: totalCalls,
        completed_calls: completedCalls,
        failed_calls: failedCalls,
        active_calls: activeCalls,
        sum_call_duration_ms: Math.round(totalCallDurationMs),
      }),
    );
  }
}
