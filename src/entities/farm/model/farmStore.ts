import { resetPreparedImageCache } from '@/src/shared/lib/image/preparedImageCache';

import { getFarmApi } from '../api/getFarmApi';
import {
  getFarmAnimalImages,
  getFarmAnimalImageSize,
  prepareFarmAnimalImages,
} from '../lib/farmAnimalImages';
import { logFarmCacheHit, logFarmPreload } from '../lib/measureFarmRequest';
import type { Farm, FarmType } from './types';

type FarmSnapshot = {
  farm: Farm | null;
  isLoading: boolean;
  isRefreshing: boolean;
};

type FarmRequest = {
  revision: number;
  session: number;
  hasForegroundConsumer: boolean;
  promise: Promise<Farm>;
};

type FarmEntry = {
  snapshot: FarmSnapshot;
  listeners: Set<() => void>;
  freshUntil: number | null;
  revision: number;
  activeRequest: FarmRequest | null;
  preloadPromise: Promise<void> | null;
};

const FARM_CACHE_DURATION_MS = 30_000;
const INITIAL_SNAPSHOT: FarmSnapshot = {
  farm: null,
  isLoading: true,
  isRefreshing: false,
};

const entries = new Map<FarmType, FarmEntry>();
let session = 0;

function getEntry(type: FarmType) {
  let entry = entries.get(type);

  if (!entry) {
    entry = {
      snapshot: INITIAL_SNAPSHOT,
      listeners: new Set(),
      freshUntil: null,
      revision: 0,
      activeRequest: null,
      preloadPromise: null,
    };
    entries.set(type, entry);
  }

  return entry;
}

function updateSnapshot(entry: FarmEntry, next: FarmSnapshot) {
  if (
    entry.snapshot.farm === next.farm &&
    entry.snapshot.isLoading === next.isLoading &&
    entry.snapshot.isRefreshing === next.isRefreshing
  ) {
    return;
  }

  entry.snapshot = next;
  entry.listeners.forEach((listener) => listener());
}

export function getFarmSnapshot(type: FarmType) {
  return getEntry(type).snapshot;
}

export function subscribeToFarm(type: FarmType, listener: () => void) {
  const entry = getEntry(type);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function invalidateFarm(type?: FarmType) {
  const invalidatedEntries = type ? [getEntry(type)] : entries.values();

  for (const entry of invalidatedEntries) {
    entry.revision += 1;
    entry.freshUntil = null;
  }
}

export function resetFarms() {
  session += 1;
  resetPreparedImageCache();
  invalidateFarm();

  for (const entry of entries.values()) {
    entry.activeRequest = null;
    entry.preloadPromise = null;
    updateSnapshot(entry, INITIAL_SNAPSHOT);
  }
}

export function loadFarm(
  type: FarmType,
  { force = false, background = false }: { force?: boolean; background?: boolean } = {},
): Promise<Farm> {
  const entry = getEntry(type);

  if (
    entry.activeRequest?.revision === entry.revision &&
    entry.activeRequest.session === session
  ) {
    if (!background) entry.activeRequest.hasForegroundConsumer = true;
    return entry.activeRequest.promise;
  }

  if (
    !force &&
    entry.snapshot.farm !== null &&
    entry.freshUntil !== null &&
    performance.now() < entry.freshUntil
  ) {
    logFarmCacheHit(type);
    return Promise.resolve(entry.snapshot.farm);
  }

  const requestRevision = entry.revision;
  const requestSession = session;
  function loadLatestForConsumer() {
    // 미리 조회에서 시작한 요청은 최신 조회로 이어져도 전역 로딩을 잡지 않습니다.
    const latest = loadFarm(type, { background });
    if (entry.activeRequest?.promise === latest) {
      entry.activeRequest.hasForegroundConsumer = true;
    }
    return latest;
  }

  const request: FarmRequest = {
    revision: requestRevision,
    session: requestSession,
    hasForegroundConsumer: !background,
    promise: Promise.resolve()
      .then(() => {
        if (requestSession !== session) {
          throw new Error('로그인 상태가 변경되었습니다.');
        }
        return getFarmApi(type, { background });
      })
      .then(
        (farm) => {
          if (requestSession !== session) {
            throw new Error('로그인 상태가 변경되었습니다.');
          }

          // 변경 이전 요청이 최신 농장 데이터를 덮어쓰지 않게 합니다.
          if (requestRevision !== entry.revision) {
            if (request.hasForegroundConsumer) return loadLatestForConsumer();
            throw new Error('농장 데이터가 변경되어 미리 조회한 결과를 사용하지 않습니다.');
          }

          entry.freshUntil = performance.now() + FARM_CACHE_DURATION_MS;
          updateSnapshot(entry, {
            farm,
            isLoading: false,
            isRefreshing: false,
          });
          return farm;
        },
        (error: unknown) => {
          if (requestSession === session && requestRevision !== entry.revision) {
            if (request.hasForegroundConsumer) return loadLatestForConsumer();
          }

          throw error;
        },
      )
      .finally(() => {
        if (entry.activeRequest !== request) return;

        entry.activeRequest = null;
        updateSnapshot(entry, {
          ...entry.snapshot,
          isLoading: false,
          isRefreshing: false,
        });
      }),
  };

  entry.activeRequest = request;
  updateSnapshot(entry, {
    ...entry.snapshot,
    isLoading: entry.snapshot.farm === null,
    isRefreshing: entry.snapshot.farm !== null,
  });
  return request.promise;
}

export function preloadFarm(type: FarmType): Promise<void> {
  const entry = getEntry(type);
  if (entry.preloadPromise !== null) return entry.preloadPromise;

  const preloadSession = session;
  logFarmPreload(type, 'started');
  entry.preloadPromise = loadFarm(type, { background: true }).then(async (farm) => {
    const imageRevision = entry.revision;
    if (preloadSession !== session || entry.snapshot.farm !== farm || entry.freshUntil === null) {
      throw new Error('미리 조회한 농장 데이터가 변경되었습니다.');
    }
    await prepareFarmAnimalImages(type, getFarmAnimalImages(farm.floors), getFarmAnimalImageSize());
    if (preloadSession !== session || imageRevision !== entry.revision || entry.snapshot.farm !== farm) {
      throw new Error('미리 준비한 농장 이미지가 변경되었습니다.');
    }
  }).then(
    () => {
      if (preloadSession === session) logFarmPreload(type, 'ready');
    },
    () => {
      // 실패한 미리 조회는 재시도하지 않고 실제 진입 시 일반 조회로 복구합니다.
      if (preloadSession === session) logFarmPreload(type, 'failed');
    },
  );
  return entry.preloadPromise;
}
