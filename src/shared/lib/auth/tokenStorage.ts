import AsyncStorage from '@react-native-async-storage/async-storage';

export type ServiceToken = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

let serviceTokenSession = 0;
let tokenMutationQueue: Promise<void> = Promise.resolve();

export function getServiceTokenSession() {
  return serviceTokenSession;
}

function enqueueTokenMutation(session: number, mutation: () => Promise<void>) {
  const operation = tokenMutationQueue.then(async () => {
    if (session !== serviceTokenSession) return;

    await mutation();
  });
  // 호출자는 원래 저장 오류를 받되 다음 작업은 실패한 작업 뒤에도 실행합니다.
  tokenMutationQueue = operation.catch(() => undefined);
  return operation;
}

async function waitForTokenMutations(mutations: Promise<unknown>[]) {
  // 하나가 실패해도 다른 네이티브 작업이 끝나기 전에 큐를 풀지 않습니다.
  const results = await Promise.allSettled(mutations);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}

export async function saveServiceToken(
  token: ServiceToken,
  expectedSession?: number,
) {
  if (expectedSession !== undefined && expectedSession !== serviceTokenSession) {
    return;
  }

  const session = expectedSession ?? ++serviceTokenSession;
  return enqueueTokenMutation(session, async () => {
    await waitForTokenMutations([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken),
    ]);
  });
}

export async function getServiceToken(): Promise<ServiceToken | null> {
  while (true) {
    const session = serviceTokenSession;
    const pendingMutations = tokenMutationQueue;
    await pendingMutations;

    if (session !== serviceTokenSession || pendingMutations !== tokenMutationQueue) {
      continue;
    }

    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);

    if (session !== serviceTokenSession || pendingMutations !== tokenMutationQueue) {
      continue;
    }

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}

export async function clearServiceToken(expectedSession?: number) {
  if (expectedSession !== undefined && expectedSession !== serviceTokenSession) {
    return;
  }

  const session = ++serviceTokenSession;
  return enqueueTokenMutation(session, async () => {
    await waitForTokenMutations([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  });
}
