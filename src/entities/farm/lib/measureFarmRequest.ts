import { env } from '@/src/shared/config/env';
import type { ApiRequestTiming } from '@/src/shared/api/client';

import type { Farm, FarmType } from '../model/types';

let runId: string | null = null;
let totalCalls = 0;
let activeCalls = 0;

function getRunId() {
  runId ??= new Date().toISOString();
  return runId;
}

export function logFarmCacheHit(type: FarmType) {
  if (!env.measureFarmLoading) return;

  console.info(
    '[farm-cache:hit]',
    JSON.stringify({ run_id: getRunId(), farm_type: type }),
  );
}

export function logFarmPreload(
  type: FarmType,
  outcome: 'started' | 'ready' | 'failed',
) {
  if (!env.measureFarmLoading) return;

  console.info(
    `[farm-preload:${outcome}]`,
    JSON.stringify({ run_id: getRunId(), farm_type: type }),
  );
}

export async function measureFarmRequest(
  type: FarmType,
  request: (onTiming?: (timing: ApiRequestTiming) => void) => Promise<Farm>,
  { background = false }: { background?: boolean } = {},
): Promise<Farm> {
  if (!env.measureFarmLoading) return request();

  const callId = ++totalCalls;
  const startedAt = performance.now();
  activeCalls += 1;
  let outcome: 'succeeded' | 'failed' = 'succeeded';
  let animalCount: number | null = null;

  console.info(
    '[farm-api:start]',
    JSON.stringify({
      run_id: getRunId(),
      call_id: callId,
      farm_type: type,
      background,
      total_calls: totalCalls,
      active_calls: activeCalls,
    }),
  );

  try {
    const farm = await request((timing) => {
      console.info(
        '[farm-api:timing]',
        JSON.stringify({
          run_id: getRunId(),
          call_id: callId,
          farm_type: type,
          background,
          ...timing,
        }),
      );
    });
    animalCount = farm.floors.reduce(
      (count, floor) => count + floor.slots.filter((slot) => slot.animal).length,
      0,
    );
    return farm;
  } catch (error) {
    outcome = 'failed';
    throw error;
  } finally {
    activeCalls -= 1;
    console.info(
      '[farm-api:complete]',
      JSON.stringify({
        run_id: getRunId(),
        call_id: callId,
        farm_type: type,
        background,
        outcome,
        duration_ms: Math.round(performance.now() - startedAt),
        animal_count: animalCount,
        total_calls: totalCalls,
        active_calls: activeCalls,
      }),
    );
  }
}
