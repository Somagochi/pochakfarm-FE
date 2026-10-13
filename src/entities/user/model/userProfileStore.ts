import { getUserProfileApi } from '../api/getUserProfileApi';
import type { UserProfile } from './types';

type UserProfileSnapshot = {
  profile: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  hasInitialLoadCompleted: boolean;
};

type ProfileRequest = {
  revision: number;
  session: number;
  promise: Promise<UserProfile>;
};

const PROFILE_CACHE_DURATION_MS = 30_000;
const INITIAL_SNAPSHOT: UserProfileSnapshot = {
  profile: null,
  isLoading: true,
  isRefreshing: false,
  hasInitialLoadCompleted: false,
};

const listeners = new Set<() => void>();
let snapshot = INITIAL_SNAPSHOT;
let freshUntil: number | null = null;
let revision = 0;
let session = 0;
let activeRequest: ProfileRequest | null = null;

function updateSnapshot(next: UserProfileSnapshot) {
  if (
    snapshot.profile === next.profile &&
    snapshot.isLoading === next.isLoading &&
    snapshot.isRefreshing === next.isRefreshing &&
    snapshot.hasInitialLoadCompleted === next.hasInitialLoadCompleted
  ) {
    return;
  }

  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function getUserProfileSnapshot() {
  return snapshot;
}

export function subscribeToUserProfile(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function invalidateUserProfile() {
  revision += 1;
  freshUntil = null;
}

export function resetUserProfile() {
  session += 1;
  invalidateUserProfile();
  activeRequest = null;
  updateSnapshot(INITIAL_SNAPSHOT);
}

export function loadUserProfile(
  { force = false }: { force?: boolean } = {},
): Promise<UserProfile> {
  if (
    activeRequest?.revision === revision &&
    activeRequest.session === session
  ) {
    return activeRequest.promise;
  }

  if (
    !force &&
    snapshot.profile !== null &&
    freshUntil !== null &&
    performance.now() < freshUntil
  ) {
    return Promise.resolve(snapshot.profile);
  }

  const requestRevision = revision;
  const requestSession = session;
  const promise: Promise<UserProfile> = Promise.resolve()
    .then(() => getUserProfileApi())
    .then(
      (profile) => {
        if (requestSession !== session) {
          throw new Error('로그인 상태가 변경되었습니다.');
        }

        // 변경 전에 시작한 응답은 버리고 변경 이후 조회 결과를 기다립니다.
        if (requestRevision !== revision) {
          return loadUserProfile();
        }

        freshUntil = performance.now() + PROFILE_CACHE_DURATION_MS;
        updateSnapshot({
          profile,
          isLoading: false,
          isRefreshing: false,
          hasInitialLoadCompleted: true,
        });
        return profile;
      },
      (error: unknown) => {
        if (requestSession === session && requestRevision !== revision) {
          return loadUserProfile();
        }

        throw error;
      },
    )
    .finally(() => {
      if (activeRequest?.promise !== promise) return;

      activeRequest = null;
      updateSnapshot({
        ...snapshot,
        isLoading: false,
        isRefreshing: false,
        hasInitialLoadCompleted: true,
      });
    });

  activeRequest = { revision: requestRevision, session: requestSession, promise };
  updateSnapshot({
    ...snapshot,
    isLoading: snapshot.profile === null,
    isRefreshing: snapshot.profile !== null,
  });
  return promise;
}
