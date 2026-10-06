const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const storePath = require.resolve('./userProfileStore.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function createStore() {
  let now = 0;
  const requests = [];
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(storePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: storePath,
  }).outputText;

  runInNewContext(source, {
    exports: module.exports,
    module,
    performance: { now: () => now },
    require(id) {
      assert.equal(id, '../api/getUserProfileApi');
      return {
        getUserProfileApi() {
          return new Promise((resolve, reject) => {
            requests.push({ resolve, reject });
          });
        },
      };
    },
  }, { filename: storePath });

  return {
    store: module.exports,
    requests,
    setNow(value) {
      now = value;
    },
  };
}

function profile(nickname, coins = 100) {
  return {
    nickname,
    level: 3,
    coins,
    currentExperience: 20,
    requiredExperience: 100,
    remainingExperience: 80,
  };
}

async function prime(harness, value = profile('처음')) {
  const pending = harness.store.loadUserProfile();
  await nextTurn();
  harness.requests.at(-1).resolve(value);
  assert.equal(await pending, value);
  return value;
}

test('동시 최초 로딩과 강제 로딩을 합치고 새 구독 및 포커스에서 캐시를 재사용한다', async () => {
  const { store, requests, setNow } = createStore();
  const first = store.loadUserProfile();
  const second = store.loadUserProfile();
  const forced = store.loadUserProfile({ force: true });
  await nextTurn();

  assert.equal(requests.length, 1);
  assert.equal(store.getUserProfileSnapshot().isLoading, true);
  assert.equal(store.getUserProfileSnapshot().hasInitialLoadCompleted, false);

  const value = profile('농장');
  requests[0].resolve(value);
  for (const result of await Promise.all([first, second, forced])) {
    assert.equal(result, value);
  }

  const snapshot = store.getUserProfileSnapshot();
  const unsubscribe = store.subscribeToUserProfile(() => {});
  setNow(1000);
  assert.equal(await store.loadUserProfile(), value);
  setNow(2000);
  assert.equal(await store.loadUserProfile(), value);
  assert.equal(requests.length, 1);
  assert.equal(store.getUserProfileSnapshot(), snapshot);
  unsubscribe();
});

test('30초 TTL 직전에는 재사용하고 정확한 만료 경계부터 다시 요청한다', async () => {
  const harness = createStore();
  const original = await prime(harness);

  harness.setNow(29999);
  assert.equal(await harness.store.loadUserProfile(), original);
  assert.equal(harness.requests.length, 1);

  harness.setNow(30000);
  const pending = harness.store.loadUserProfile();
  await nextTurn();
  assert.equal(harness.requests.length, 2);
  assert.equal(harness.store.getUserProfileSnapshot().profile, original);

  const updated = profile('갱신');
  harness.requests[1].resolve(updated);
  assert.equal(await pending, updated);
});

test('강제 갱신은 유효한 캐시도 다시 요청하되 최초 로딩 상태를 켜지 않는다', async () => {
  const harness = createStore();
  const original = await prime(harness);
  harness.setNow(1);

  const first = harness.store.loadUserProfile({ force: true });
  const second = harness.store.loadUserProfile({ force: true });
  await nextTurn();

  assert.equal(harness.requests.length, 2);
  const during = harness.store.getUserProfileSnapshot();
  assert.equal(during.profile, original);
  assert.equal(during.isLoading, false);
  assert.equal(during.isRefreshing, true);
  assert.equal(during.hasInitialLoadCompleted, true);

  const updated = profile('새 닉네임');
  harness.requests[1].resolve(updated);
  assert.equal(await first, updated);
  assert.equal(await second, updated);
  assert.equal(harness.store.getUserProfileSnapshot().isRefreshing, false);

  const nextForced = harness.store.loadUserProfile({ force: true });
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  harness.requests[2].resolve(updated);
  await nextForced;
});

test('무효화는 기존 화면 데이터를 유지하고 TTL 안에서도 다음 요청을 실행한다', async () => {
  const harness = createStore();
  const original = await prime(harness);

  harness.store.invalidateUserProfile();
  assert.equal(harness.store.getUserProfileSnapshot().profile, original);
  assert.equal(harness.store.getUserProfileSnapshot().isLoading, false);

  const pending = harness.store.loadUserProfile();
  await nextTurn();
  assert.equal(harness.requests.length, 2);
  const updated = profile('확장 후', 50);
  harness.requests[1].resolve(updated);
  assert.equal(await pending, updated);
});

test('진행 중 요청을 무효화하면 이전 성공과 실패 모두 최신 요청으로 이어진다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const pending = store.loadUserProfile();
      let settled = false;
      void pending.then(() => { settled = true; }, () => { settled = true; });
      await nextTurn();

      store.invalidateUserProfile();
      if (outcome === '성공') {
        requests[0].resolve(profile('변경 이전'));
      } else {
        requests[0].reject(new Error('무효화된 요청 실패'));
      }
      await nextTurn();

      assert.equal(requests.length, 2);
      assert.equal(settled, false);
      assert.equal(store.getUserProfileSnapshot().profile, null);
      assert.equal(store.getUserProfileSnapshot().isLoading, true);

      const latest = profile('변경 이후');
      requests[1].resolve(latest);
      assert.equal(await pending, latest);
      assert.equal(store.getUserProfileSnapshot().profile, latest);
    });
  }
});

test('변경 후 새 요청이 시작됐으면 이전 응답은 새 요청을 덮어쓰거나 해제하지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const harness = createStore();
      const original = await prime(harness);
      const oldPending = harness.store.loadUserProfile({ force: true });
      await nextTurn();
      harness.store.invalidateUserProfile();
      const newPending = harness.store.loadUserProfile();
      await nextTurn();
      assert.equal(harness.requests.length, 3);

      if (outcome === '성공') {
        harness.requests[1].resolve(profile('늦게 도착한 이전 값'));
      } else {
        harness.requests[1].reject(new Error('이전 요청 실패'));
      }
      await nextTurn();
      assert.equal(harness.store.getUserProfileSnapshot().profile, original);
      assert.equal(harness.store.getUserProfileSnapshot().isRefreshing, true);

      const duplicate = harness.store.loadUserProfile({ force: true });
      await nextTurn();
      assert.equal(harness.requests.length, 3);
      const latest = profile('변경 완료', 25);
      harness.requests[2].resolve(latest);
      for (const result of await Promise.all([oldPending, newPending, duplicate])) {
        assert.equal(result, latest);
      }
      assert.equal(harness.store.getUserProfileSnapshot().profile, latest);
    });
  }
});

test('최신 요청이 먼저 끝났으면 이전 성공과 실패가 추가 요청 없이 최신 캐시를 반환한다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const oldPending = store.loadUserProfile();
      const oldCompletion = oldPending.then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      await nextTurn();
      store.invalidateUserProfile();
      const newPending = store.loadUserProfile();
      await nextTurn();
      assert.equal(requests.length, 2);

      const latest = profile('최신 요청 먼저 완료');
      requests[1].resolve(latest);
      assert.equal(await newPending, latest);
      const ready = store.getUserProfileSnapshot();
      assert.equal(ready.profile, latest);
      assert.equal(ready.isRefreshing, false);

      if (outcome === '성공') {
        requests[0].resolve(profile('뒤늦은 이전 응답'));
      } else {
        requests[0].reject(new Error('뒤늦은 이전 요청 실패'));
      }
      await nextTurn();

      assert.equal(requests.length, 2);
      const completion = await oldCompletion;
      assert.equal(completion.error, undefined);
      assert.equal(completion.value, latest);
      assert.equal(store.getUserProfileSnapshot(), ready);
    });
  }
});

test('세션 초기화 뒤 이전 요청의 성공과 실패는 새 계정 요청에 영향을 주지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const oldPending = store.loadUserProfile();
      const oldRejection = assert.rejects(oldPending);
      await nextTurn();
      store.resetUserProfile();
      assert.equal(store.getUserProfileSnapshot().profile, null);
      assert.equal(store.getUserProfileSnapshot().hasInitialLoadCompleted, false);

      const newPending = store.loadUserProfile();
      await nextTurn();
      assert.equal(requests.length, 2);
      if (outcome === '성공') {
        requests[0].resolve(profile('이전 계정'));
      } else {
        requests[0].reject(new Error('이전 계정 요청 실패'));
      }
      await oldRejection;
      assert.equal(store.getUserProfileSnapshot().profile, null);
      assert.equal(store.getUserProfileSnapshot().isLoading, true);

      const duplicate = store.loadUserProfile({ force: true });
      await nextTurn();
      assert.equal(requests.length, 2);
      const nextAccount = profile('새 계정');
      requests[1].resolve(nextAccount);
      assert.equal(await newPending, nextAccount);
      assert.equal(await duplicate, nextAccount);
      assert.equal(store.getUserProfileSnapshot().profile, nextAccount);
    });
  }
});

test('최초 실패는 로딩을 끝내고 명시적인 재시도로 복구할 수 있다', async () => {
  const { store, requests } = createStore();
  const pending = store.loadUserProfile();
  const failure = new Error('최초 연결 실패');
  const rejected = assert.rejects(pending, (error) => error === failure);
  await nextTurn();
  requests[0].reject(failure);
  await rejected;

  const failed = store.getUserProfileSnapshot();
  assert.equal(failed.profile, null);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isRefreshing, false);
  assert.equal(failed.hasInitialLoadCompleted, true);

  const retry = store.loadUserProfile({ force: true });
  await nextTurn();
  assert.equal(requests.length, 2);
  const recovered = profile('재시도 성공');
  requests[1].resolve(recovered);
  assert.equal(await retry, recovered);
  assert.equal(store.getUserProfileSnapshot().profile, recovered);
});

test('배경 갱신 실패는 데이터를 보존하고 만료 시간을 연장하지 않아 재시도할 수 있다', async () => {
  const harness = createStore();
  const original = await prime(harness);
  harness.setNow(30000);
  const pending = harness.store.loadUserProfile();
  const failure = new Error('배경 연결 실패');
  const rejected = assert.rejects(pending, (error) => error === failure);
  await nextTurn();
  harness.requests[1].reject(failure);
  await rejected;

  const failed = harness.store.getUserProfileSnapshot();
  assert.equal(failed.profile, original);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isRefreshing, false);
  assert.equal(failed.hasInitialLoadCompleted, true);

  const retry = harness.store.loadUserProfile();
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  const recovered = profile('배경 재시도 성공');
  harness.requests[2].resolve(recovered);
  assert.equal(await retry, recovered);
});

test('스냅샷 참조를 유지하고 변경만 구독자에게 알리며 구독 해제를 지원한다', async () => {
  const harness = createStore();
  const initial = harness.store.getUserProfileSnapshot();
  assert.equal(harness.store.getUserProfileSnapshot(), initial);
  const original = await prime(harness);
  const ready = harness.store.getUserProfileSnapshot();
  assert.notEqual(ready, initial);
  assert.equal(harness.store.getUserProfileSnapshot(), ready);

  const notifications = [];
  const unsubscribe = harness.store.subscribeToUserProfile(() => {
    notifications.push(harness.store.getUserProfileSnapshot());
  });
  assert.equal(await harness.store.loadUserProfile(), original);
  assert.equal(notifications.length, 0);
  assert.equal(harness.store.getUserProfileSnapshot(), ready);

  const pending = harness.store.loadUserProfile({ force: true });
  await nextTurn();
  assert.ok(notifications.some((snapshot) => snapshot.isRefreshing));
  const updated = profile('구독 갱신');
  harness.requests[1].resolve(updated);
  await pending;
  assert.equal(notifications.at(-1).profile, updated);
  assert.equal(notifications.at(-1).isRefreshing, false);

  unsubscribe();
  const previousCount = notifications.length;
  const afterUnsubscribe = harness.store.loadUserProfile({ force: true });
  await nextTurn();
  harness.requests[2].resolve(profile('구독 해제 후'));
  await afterUnsubscribe;
  assert.equal(notifications.length, previousCount);
});
