const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const storePath = require.resolve('./farmStore.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function createStore(options = {}) {
  let now = 0;
  const requests = [];
  const imagePreparations = [];
  const preloadEvents = [];
  let imageCacheResets = 0;
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
      if (id === '../lib/measureFarmRequest') {
        return {
          logFarmCacheHit() {},
          logFarmPreload(type, outcome) { preloadEvents.push({ type, outcome }); },
        };
      }
      if (id === '@/src/shared/lib/image/preparedImageCache') {
        return { resetPreparedImageCache() { imageCacheResets += 1; } };
      }
      if (id === '../lib/farmAnimalImages') {
        return {
          getFarmAnimalImages: (floors) => floors,
          getFarmAnimalImageSize: () => ({ maxWidth: 288, maxHeight: 263 }),
          prepareFarmAnimalImages(type, images, size) {
            if (!options.deferImages) return Promise.resolve(new Map());
            return new Promise((resolve, reject) => {
              imagePreparations.push({ type, images, size, resolve, reject });
            });
          },
        };
      }
      assert.equal(id, '../api/getFarmApi');
      return {
        getFarmApi(type, options = {}) {
          return new Promise((resolve, reject) => {
            requests.push({ type, background: options.background === true, resolve, reject });
          });
        },
      };
    },
  }, { filename: storePath });

  return {
    store: module.exports,
    requests,
    imagePreparations,
    preloadEvents,
    imageCacheResetCount: () => imageCacheResets,
    setNow(value) {
      now = value;
    },
  };
}

function farm(type, animalName = '처음 동물') {
  return {
    type,
    page: 0,
    size: 4,
    totalPages: 1,
    floors: [{
      floorNum: 1,
      unlocked: true,
      slots: [{
        slotNum: 1,
        animal: {
          animalId: 1,
          animalName,
          cardImageUrl: null,
          animalImageUrl: null,
        },
      }],
    }],
  };
}

async function prime(harness, type, value = farm(type)) {
  const pending = harness.store.loadFarm(type);
  await nextTurn();
  const request = harness.requests.at(-1);
  assert.equal(request.type, type);
  request.resolve(value);
  assert.equal(await pending, value);
  return value;
}

test('미리 조회는 데이터 뒤에 이미지까지 준비하며 실제 데이터 소비자는 이미지 준비와 별개로 응답을 받는다', async () => {
  const harness = createStore({ deferImages: true });
  const warm = harness.store.preloadFarm('SPACE');
  let isReady = false;
  void warm.then(() => { isReady = true; });
  await nextTurn();
  assert.equal(harness.imagePreparations.length, 0);
  const value = farm('SPACE');
  harness.requests[0].resolve(value);
  await nextTurn();
  assert.equal(harness.imagePreparations.length, 1);
  assert.equal(harness.imagePreparations[0].type, 'SPACE');
  assert.equal(harness.imagePreparations[0].images, value.floors);
  assert.equal(isReady, false);
  assert.equal(await harness.store.loadFarm('SPACE'), value);
  assert.equal(harness.requests.length, 1);
  harness.imagePreparations[0].resolve(new Map());
  await warm;
  assert.equal(isReady, true);
  assert.equal(harness.preloadEvents.at(-1).outcome, 'ready');
});

test('이미지 준비 중 농장 무효화는 준비 완료로 표시하지 않고 추가 요청도 만들지 않는다', async () => {
  const harness = createStore({ deferImages: true });
  const warm = harness.store.preloadFarm('SPACE');
  await nextTurn();
  harness.requests[0].resolve(farm('SPACE'));
  await nextTurn();
  harness.store.invalidateFarm('SPACE');
  harness.imagePreparations[0].resolve(new Map());
  await warm;
  assert.equal(harness.preloadEvents.at(-1).outcome, 'failed');
  assert.equal(harness.requests.length, 1);
  const latest = harness.store.loadFarm('SPACE');
  await nextTurn();
  harness.requests[1].resolve(farm('SPACE', '변경 후'));
  assert.equal((await latest).floors[0].slots[0].animal.animalName, '변경 후');
});

test('계정 초기화는 이미지 캐시도 비우고 이전 이미지 완료가 새 선로딩에 영향을 주지 않는다', async () => {
  const harness = createStore({ deferImages: true });
  const oldWarm = harness.store.preloadFarm('SPACE');
  await nextTurn();
  harness.requests[0].resolve(farm('SPACE', '이전 계정'));
  await nextTurn();
  harness.store.resetFarms();
  assert.equal(harness.imageCacheResetCount(), 1);
  const newWarm = harness.store.preloadFarm('SPACE');
  await nextTurn();
  const value = farm('SPACE', '새 계정');
  harness.requests[1].resolve(value);
  await nextTurn();
  harness.imagePreparations[0].resolve(new Map());
  await oldWarm;
  assert.equal(harness.store.preloadFarm('SPACE'), newWarm);
  assert.equal(harness.preloadEvents.filter((event) => event.outcome === 'ready').length, 0);
  harness.imagePreparations[1].resolve(new Map());
  await newWarm;
  assert.equal(harness.store.getFarmSnapshot('SPACE').farm, value);
  assert.equal(harness.preloadEvents.filter((event) => event.outcome === 'ready').length, 1);
});

test('이미지 준비 완료는 데이터 캐시의 30초 유효시간을 연장하지 않는다', async () => {
  const harness = createStore({ deferImages: true });
  const warm = harness.store.preloadFarm('SPACE');
  await nextTurn();
  harness.setNow(1_000);
  harness.requests[0].resolve(farm('SPACE'));
  await nextTurn();
  harness.setNow(20_000);
  harness.imagePreparations[0].resolve(new Map());
  await warm;
  harness.setNow(31_000);
  const latest = harness.store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(harness.requests.length, 2);
  harness.requests[1].resolve(farm('SPACE', '새 조회'));
  await latest;
});

test('이미지 준비 오류는 농장 데이터 캐시를 제거하지 않고 실제 진입에서 준비를 다시 시도할 수 있다', async () => {
  const harness = createStore({ deferImages: true });
  const warm = harness.store.preloadFarm('SPACE');
  await nextTurn();
  const value = farm('SPACE');
  harness.requests[0].resolve(value);
  await nextTurn();
  harness.imagePreparations[0].reject(new Error('이미지 초기화 실패'));
  await warm;
  assert.equal(harness.preloadEvents.at(-1).outcome, 'failed');
  assert.equal(await harness.store.loadFarm('SPACE'), value);
  assert.equal(harness.requests.length, 1);
});

test('같은 환경의 동시 최초 및 강제 요청은 합치고 다른 환경은 독립적으로 요청한다', async () => {
  const { store, requests } = createStore();
  const groundFirst = store.loadFarm('GROUND');
  const groundSecond = store.loadFarm('GROUND');
  const groundForced = store.loadFarm('GROUND', { force: true });
  const spacePending = store.loadFarm('SPACE');
  await nextTurn();

  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map((request) => request.type), ['GROUND', 'SPACE']);
  assert.equal(store.getFarmSnapshot('GROUND').isLoading, true);
  assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);

  const ground = farm('GROUND');
  requests[0].resolve(ground);
  for (const result of await Promise.all([groundFirst, groundSecond, groundForced])) {
    assert.equal(result, ground);
  }
  assert.equal(store.getFarmSnapshot('GROUND').farm, ground);
  assert.equal(store.getFarmSnapshot('SPACE').farm, null);
  assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);
  assert.equal(await store.loadFarm('GROUND'), ground);
  assert.equal(requests.length, 2);

  const space = farm('SPACE');
  requests[1].resolve(space);
  assert.equal(await spacePending, space);
  assert.equal(store.getFarmSnapshot('SPACE').farm, space);
  assert.equal(store.getFarmSnapshot('GROUND').farm, ground);
});

test('30초 만료 경계를 환경별로 따로 적용하고 유효한 환경은 재사용한다', async () => {
  const harness = createStore();
  const ground = await prime(harness, 'GROUND');
  harness.setNow(1000);
  const space = await prime(harness, 'SPACE');

  harness.setNow(29999);
  assert.equal(await harness.store.loadFarm('GROUND'), ground);
  assert.equal(await harness.store.loadFarm('SPACE'), space);
  assert.equal(harness.requests.length, 2);

  harness.setNow(30000);
  const groundRefresh = harness.store.loadFarm('GROUND');
  assert.equal(await harness.store.loadFarm('SPACE'), space);
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  assert.equal(harness.requests[2].type, 'GROUND');
  const nextGround = farm('GROUND', '땅 갱신');
  harness.requests[2].resolve(nextGround);
  assert.equal(await groundRefresh, nextGround);

  harness.setNow(31000);
  const spaceRefresh = harness.store.loadFarm('SPACE');
  assert.equal(await harness.store.loadFarm('GROUND'), nextGround);
  await nextTurn();
  assert.equal(harness.requests.length, 4);
  assert.equal(harness.requests[3].type, 'SPACE');
  const nextSpace = farm('SPACE', '우주 갱신');
  harness.requests[3].resolve(nextSpace);
  assert.equal(await spaceRefresh, nextSpace);
});

test('강제 갱신은 유효한 캐시도 요청하고 배경 상태로 표시하며 진행 중 강제 요청을 합친다', async () => {
  const harness = createStore();
  const original = await prime(harness, 'SPACE');
  harness.setNow(1);

  const first = harness.store.loadFarm('SPACE', { force: true });
  const second = harness.store.loadFarm('SPACE', { force: true });
  await nextTurn();
  assert.equal(harness.requests.length, 2);
  const during = harness.store.getFarmSnapshot('SPACE');
  assert.equal(during.farm, original);
  assert.equal(during.isLoading, false);
  assert.equal(during.isRefreshing, true);

  const latest = farm('SPACE', '배경 갱신');
  harness.requests[1].resolve(latest);
  assert.equal(await first, latest);
  assert.equal(await second, latest);
  assert.equal(harness.store.getFarmSnapshot('SPACE').isRefreshing, false);

  const nextForced = harness.store.loadFarm('SPACE', { force: true });
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  harness.requests[2].resolve(latest);
  await nextForced;
});

test('특정 환경 무효화는 데이터와 다른 환경 캐시를 보존한다', async () => {
  const harness = createStore();
  const ground = await prime(harness, 'GROUND');
  const space = await prime(harness, 'SPACE');
  const spaceSnapshot = harness.store.getFarmSnapshot('SPACE');

  harness.store.invalidateFarm('GROUND');
  assert.equal(harness.store.getFarmSnapshot('GROUND').farm, ground);
  assert.equal(harness.store.getFarmSnapshot('GROUND').isLoading, false);
  assert.equal(harness.store.getFarmSnapshot('SPACE'), spaceSnapshot);
  assert.equal(await harness.store.loadFarm('SPACE'), space);

  const pending = harness.store.loadFarm('GROUND');
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  assert.equal(harness.requests[2].type, 'GROUND');
  const latest = farm('GROUND', '배치 변경');
  harness.requests[2].resolve(latest);
  assert.equal(await pending, latest);
});

test('전체 무효화는 모든 환경 데이터를 보존하고 다음 조회를 새로 실행한다', async () => {
  const harness = createStore();
  const ground = await prime(harness, 'GROUND');
  const space = await prime(harness, 'SPACE');

  harness.store.invalidateFarm();
  assert.equal(harness.store.getFarmSnapshot('GROUND').farm, ground);
  assert.equal(harness.store.getFarmSnapshot('SPACE').farm, space);
  const groundPending = harness.store.loadFarm('GROUND');
  const spacePending = harness.store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(harness.requests.length, 4);
  assert.deepEqual(harness.requests.slice(2).map((request) => request.type), ['GROUND', 'SPACE']);

  const latestGround = farm('GROUND', '저장 후 땅');
  const latestSpace = farm('SPACE', '저장 후 우주');
  harness.requests[2].resolve(latestGround);
  harness.requests[3].resolve(latestSpace);
  assert.equal(await groundPending, latestGround);
  assert.equal(await spacePending, latestSpace);
});

test('무효화된 진행 중 요청의 이전 성공과 실패는 최신 조회로 이어진다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const pending = store.loadFarm('SPACE');
      let settled = false;
      void pending.then(() => { settled = true; }, () => { settled = true; });
      await nextTurn();
      store.invalidateFarm('SPACE');

      if (outcome === '성공') {
        requests[0].resolve(farm('SPACE', '변경 이전'));
      } else {
        requests[0].reject(new Error('무효화된 요청 실패'));
      }
      await nextTurn();
      assert.equal(requests.length, 2);
      assert.equal(requests[1].type, 'SPACE');
      assert.equal(settled, false);
      assert.equal(store.getFarmSnapshot('SPACE').farm, null);
      assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);

      const latest = farm('SPACE', '변경 이후');
      requests[1].resolve(latest);
      assert.equal(await pending, latest);
      assert.equal(store.getFarmSnapshot('SPACE').farm, latest);
    });
  }
});

test('변경 후 새 조회 중에 이전 요청이 끝나도 최신 데이터를 덮거나 새 요청을 해제하지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const harness = createStore();
      const original = await prime(harness, 'SPACE');
      const oldPending = harness.store.loadFarm('SPACE', { force: true });
      await nextTurn();
      harness.store.invalidateFarm('SPACE');
      const newPending = harness.store.loadFarm('SPACE');
      await nextTurn();
      assert.equal(harness.requests.length, 3);

      if (outcome === '성공') {
        harness.requests[1].resolve(farm('SPACE', '늦게 도착한 이전 값'));
      } else {
        harness.requests[1].reject(new Error('이전 조회 실패'));
      }
      await nextTurn();
      assert.equal(harness.store.getFarmSnapshot('SPACE').farm, original);
      assert.equal(harness.store.getFarmSnapshot('SPACE').isRefreshing, true);

      const duplicate = harness.store.loadFarm('SPACE', { force: true });
      await nextTurn();
      assert.equal(harness.requests.length, 3);
      const latest = farm('SPACE', '이동 완료');
      harness.requests[2].resolve(latest);
      for (const result of await Promise.all([oldPending, newPending, duplicate])) {
        assert.equal(result, latest);
      }
      assert.equal(harness.store.getFarmSnapshot('SPACE').farm, latest);
    });
  }
});

test('최신 조회가 먼저 완료되면 이전 성공과 실패가 추가 요청 없이 최신 캐시를 반환한다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const oldPending = store.loadFarm('SPACE');
      const oldCompletion = oldPending.then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      await nextTurn();
      store.invalidateFarm('SPACE');
      const newPending = store.loadFarm('SPACE');
      await nextTurn();

      const latest = farm('SPACE', '최신 조회 먼저 완료');
      requests[1].resolve(latest);
      assert.equal(await newPending, latest);
      const ready = store.getFarmSnapshot('SPACE');
      if (outcome === '성공') {
        requests[0].resolve(farm('SPACE', '뒤늦은 이전 값'));
      } else {
        requests[0].reject(new Error('뒤늦은 이전 실패'));
      }
      await nextTurn();

      assert.equal(requests.length, 2);
      const completion = await oldCompletion;
      assert.equal(completion.error, undefined);
      assert.equal(completion.value, latest);
      assert.equal(store.getFarmSnapshot('SPACE'), ready);
    });
  }
});

test('다른 환경 변경은 현재 환경에서 진행 중인 요청을 무효화하지 않는다', async () => {
  const { store, requests } = createStore();
  const pending = store.loadFarm('SPACE');
  await nextTurn();
  store.invalidateFarm('GROUND');

  const space = farm('SPACE');
  requests[0].resolve(space);
  assert.equal(await pending, space);
  assert.equal(requests.length, 1);
  assert.equal(store.getFarmSnapshot('SPACE').farm, space);
});

test('세션 초기화 후 모든 이전 환경 요청은 새 계정 상태와 요청에 영향을 주지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const oldSpace = store.loadFarm('SPACE');
      const oldGround = store.loadFarm('GROUND');
      const spaceRejection = assert.rejects(oldSpace);
      const groundRejection = assert.rejects(oldGround);
      await nextTurn();
      store.resetFarms();
      assert.equal(store.getFarmSnapshot('SPACE').farm, null);
      assert.equal(store.getFarmSnapshot('GROUND').farm, null);

      const newPending = store.loadFarm('SPACE');
      await nextTurn();
      assert.equal(requests.length, 3);
      if (outcome === '성공') {
        requests[0].resolve(farm('SPACE', '이전 계정 우주'));
      } else {
        requests[0].reject(new Error('이전 계정 요청 실패'));
      }
      requests[1].resolve(farm('GROUND', '이전 계정 땅'));
      await Promise.all([spaceRejection, groundRejection]);
      assert.equal(store.getFarmSnapshot('SPACE').farm, null);
      assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);
      assert.equal(store.getFarmSnapshot('GROUND').farm, null);

      const duplicate = store.loadFarm('SPACE', { force: true });
      await nextTurn();
      assert.equal(requests.length, 3);
      const nextAccount = farm('SPACE', '새 계정 우주');
      requests[2].resolve(nextAccount);
      assert.equal(await newPending, nextAccount);
      assert.equal(await duplicate, nextAccount);
      assert.equal(store.getFarmSnapshot('SPACE').farm, nextAccount);
      assert.equal(store.getFarmSnapshot('GROUND').farm, null);
    });
  }
});

test('세션 초기화는 완료된 모든 환경 캐시도 삭제한다', async () => {
  const harness = createStore();
  await prime(harness, 'GROUND');
  await prime(harness, 'SPACE');
  harness.store.resetFarms();
  for (const type of ['GROUND', 'SPACE', 'SEA', 'SKY']) {
    assert.equal(harness.store.getFarmSnapshot(type).farm, null);
    assert.equal(harness.store.getFarmSnapshot(type).isRefreshing, false);
  }

  const pending = harness.store.loadFarm('GROUND');
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  const nextAccount = farm('GROUND', '새 계정 땅');
  harness.requests[2].resolve(nextAccount);
  assert.equal(await pending, nextAccount);
});

test('최초 실패는 로딩을 끝내고 다른 환경에 영향을 주지 않으며 재시도로 복구한다', async () => {
  const { store, requests } = createStore();
  const groundInitial = store.getFarmSnapshot('GROUND');
  const pending = store.loadFarm('SPACE');
  const failure = new Error('최초 연결 실패');
  const rejected = assert.rejects(pending, (error) => error === failure);
  await nextTurn();
  requests[0].reject(failure);
  await rejected;

  const failed = store.getFarmSnapshot('SPACE');
  assert.equal(failed.farm, null);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isRefreshing, false);
  assert.equal(store.getFarmSnapshot('GROUND'), groundInitial);

  const retry = store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(requests.length, 2);
  const recovered = farm('SPACE', '재시도 성공');
  requests[1].resolve(recovered);
  assert.equal(await retry, recovered);
  assert.equal(store.getFarmSnapshot('SPACE').farm, recovered);
});

test('배경 실패는 농장 데이터를 보존하고 만료 시간을 연장하지 않아 재시도할 수 있다', async () => {
  const harness = createStore();
  const original = await prime(harness, 'SPACE');
  harness.setNow(30000);
  const pending = harness.store.loadFarm('SPACE');
  const failure = new Error('배경 연결 실패');
  const rejected = assert.rejects(pending, (error) => error === failure);
  await nextTurn();
  harness.requests[1].reject(failure);
  await rejected;

  const failed = harness.store.getFarmSnapshot('SPACE');
  assert.equal(failed.farm, original);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isRefreshing, false);
  const retry = harness.store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(harness.requests.length, 3);
  const recovered = farm('SPACE', '배경 재시도 성공');
  harness.requests[2].resolve(recovered);
  assert.equal(await retry, recovered);
});

test('스냅샷은 변경 전까지 안정적이고 환경별 구독 및 구독 해제가 독립적으로 동작한다', async () => {
  const harness = createStore();
  const initial = harness.store.getFarmSnapshot('GROUND');
  assert.equal(harness.store.getFarmSnapshot('GROUND'), initial);
  const ground = await prime(harness, 'GROUND');
  await prime(harness, 'SPACE');
  const ready = harness.store.getFarmSnapshot('GROUND');
  assert.notEqual(ready, initial);

  const groundNotifications = [];
  const spaceNotifications = [];
  const unsubscribeGround = harness.store.subscribeToFarm('GROUND', () => {
    groundNotifications.push(harness.store.getFarmSnapshot('GROUND'));
  });
  const unsubscribeSpace = harness.store.subscribeToFarm('SPACE', () => {
    spaceNotifications.push(harness.store.getFarmSnapshot('SPACE'));
  });
  assert.equal(await harness.store.loadFarm('GROUND'), ground);
  assert.equal(groundNotifications.length, 0);
  assert.equal(spaceNotifications.length, 0);
  assert.equal(harness.store.getFarmSnapshot('GROUND'), ready);

  const pending = harness.store.loadFarm('SPACE', { force: true });
  await nextTurn();
  assert.equal(groundNotifications.length, 0);
  assert.ok(spaceNotifications.some((snapshot) => snapshot.isRefreshing));
  const latest = farm('SPACE', '구독 갱신');
  harness.requests[2].resolve(latest);
  await pending;
  assert.equal(spaceNotifications.at(-1).farm, latest);
  assert.equal(spaceNotifications.at(-1).isRefreshing, false);
  assert.equal(groundNotifications.length, 0);

  unsubscribeSpace();
  const previousSpaceCount = spaceNotifications.length;
  harness.store.resetFarms();
  assert.equal(groundNotifications.at(-1).farm, null);
  assert.equal(spaceNotifications.length, previousSpaceCount);
  unsubscribeGround();
  const previousGroundCount = groundNotifications.length;
  const afterUnsubscribe = harness.store.loadFarm('GROUND');
  await nextTurn();
  harness.requests[3].resolve(farm('GROUND', '구독 해제 후'));
  await afterUnsubscribe;
  assert.equal(groundNotifications.length, previousGroundCount);
});

test('환경별 preload는 한 번만 background로 요청하고 같은 세션에서 완료 후에도 같은 promise를 반환한다', async () => {
  const { store, requests } = createStore();
  const first = store.preloadFarm('SPACE');
  const duplicate = store.preloadFarm('SPACE');
  const seaPending = store.preloadFarm('SEA');
  assert.equal(first, duplicate);
  await nextTurn();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map((request) => [request.type, request.background]), [
    ['SPACE', true], ['SEA', true],
  ]);

  const space = farm('SPACE', '미리 준비한 우주');
  const sea = farm('SEA', '미리 준비한 바다');
  requests[0].resolve(space);
  requests[1].resolve(sea);
  assert.equal(await first, undefined);
  assert.equal(await seaPending, undefined);
  assert.equal(store.preloadFarm('SPACE'), first);
  assert.equal(store.getFarmSnapshot('SPACE').farm, space);
  assert.equal(store.getFarmSnapshot('SEA').farm, sea);
  assert.equal(await store.loadFarm('SPACE'), space);
  assert.equal(requests.length, 2);
});

test('유효한 캐시를 이용한 preload도 한 번 시도로 기록하며 TTL 만료 후 조회는 foreground로 실행한다', async () => {
  const harness = createStore();
  const original = await prime(harness, 'SPACE');
  const ready = harness.store.getFarmSnapshot('SPACE');
  const warm = harness.store.preloadFarm('SPACE');
  assert.equal(await warm, undefined);
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.store.getFarmSnapshot('SPACE'), ready);

  harness.setNow(30000);
  assert.equal(harness.store.preloadFarm('SPACE'), warm);
  await nextTurn();
  assert.equal(harness.requests.length, 1);
  const pending = harness.store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(harness.requests.length, 2);
  assert.equal(harness.requests[1].background, false);
  assert.equal(harness.store.getFarmSnapshot('SPACE').farm, original);
  const latest = farm('SPACE', '만료 후 조회');
  harness.requests[1].resolve(latest);
  assert.equal(await pending, latest);
});

test('preload 실패는 조용히 끝나며 자동 재시도하지 않고 정상 조회와 새 세션 preload는 다시 실행한다', async () => {
  const { store, requests } = createStore();
  const warm = store.preloadFarm('SPACE');
  await nextTurn();
  requests[0].reject(new Error('미리 조회 실패'));
  assert.equal(await warm, undefined);
  assert.equal(store.getFarmSnapshot('SPACE').farm, null);
  assert.equal(store.getFarmSnapshot('SPACE').isLoading, false);
  assert.equal(store.preloadFarm('SPACE'), warm);
  await nextTurn();
  assert.equal(requests.length, 1);

  const retry = store.loadFarm('SPACE');
  await nextTurn();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].background, false);
  const recovered = farm('SPACE', '일반 조회 복구');
  requests[1].resolve(recovered);
  assert.equal(await retry, recovered);

  store.resetFarms();
  const newWarm = store.preloadFarm('SPACE');
  assert.notEqual(newWarm, warm);
  await nextTurn();
  assert.equal(requests.length, 3);
  assert.equal(requests[2].background, true);
  const nextAccount = farm('SPACE', '새 계정 준비');
  requests[2].resolve(nextAccount);
  await newWarm;
  assert.equal(store.getFarmSnapshot('SPACE').farm, nextAccount);
});

test('preload에 합류한 foreground 조회는 중복 요청 없이 원래 오류를 받는다', async () => {
  const { store, requests } = createStore();
  const warm = store.preloadFarm('SPACE');
  const foreground = store.loadFarm('SPACE', { force: true });
  const failure = new Error('합류한 요청 실패');
  const rejected = assert.rejects(foreground, (error) => error === failure);
  await nextTurn();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].background, true);
  assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);
  requests[0].reject(failure);
  assert.equal(await warm, undefined);
  await rejected;
  assert.equal(store.getFarmSnapshot('SPACE').isLoading, false);
});

test('foreground 소비자 없이 무효화된 preload의 성공과 실패는 캐시를 덮거나 새 요청을 만들지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const harness = createStore();
      const original = await prime(harness, 'SPACE');
      harness.setNow(30000);
      const warm = harness.store.preloadFarm('SPACE');
      let settled = false;
      void warm.then(() => { settled = true; });
      await nextTurn();
      assert.equal(harness.requests[1].background, true);
      harness.store.invalidateFarm('SPACE');
      if (outcome === '성공') {
        harness.requests[1].resolve(farm('SPACE', '변경 이전 준비 값'));
      } else {
        harness.requests[1].reject(new Error('변경 이전 준비 실패'));
      }
      await nextTurn();

      assert.equal(settled, true);
      assert.equal(harness.requests.length, 2);
      assert.equal(harness.store.getFarmSnapshot('SPACE').farm, original);
      assert.equal(harness.store.getFarmSnapshot('SPACE').isRefreshing, false);
      assert.equal(harness.store.preloadFarm('SPACE'), warm);
      await warm;
      const retry = harness.store.loadFarm('SPACE');
      await nextTurn();
      assert.equal(harness.requests.length, 3);
      assert.equal(harness.requests[2].background, false);
      const latest = farm('SPACE', '변경 후 일반 조회');
      harness.requests[2].resolve(latest);
      assert.equal(await retry, latest);
    });
  }
});

test('foreground가 합류한 preload의 무효화는 background 모드를 유지하며 최신 조회를 이어받는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const warm = store.preloadFarm('SPACE');
      const foreground = store.loadFarm('SPACE');
      await nextTurn();
      assert.equal(requests.length, 1);
      store.invalidateFarm('SPACE');
      if (outcome === '성공') {
        requests[0].resolve(farm('SPACE', '변경 이전 준비 값'));
      } else {
        requests[0].reject(new Error('변경 이전 준비 실패'));
      }
      await nextTurn();

      assert.equal(requests.length, 2);
      assert.equal(requests[1].background, true);
      assert.equal(store.getFarmSnapshot('SPACE').farm, null);
      assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);
      store.invalidateFarm('SPACE');
      requests[1].resolve(farm('SPACE', '두 번째 변경 이전 값'));
      await nextTurn();
      assert.equal(requests.length, 3);
      assert.equal(requests[2].background, true);
      const latest = farm('SPACE', '변경 후 foreground 값');
      requests[2].resolve(latest);
      assert.equal(await foreground, latest);
      assert.equal(await warm, undefined);
      assert.equal(store.getFarmSnapshot('SPACE').farm, latest);
    });
  }
});

test('무효화 후 새 foreground 요청과 이전 preload가 어떤 순서로 끝나도 최신 데이터와 요청을 보존한다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    for (const order of ['이전 먼저', '최신 먼저']) {
      await t.test(`${outcome}: ${order}`, async () => {
        const { store, requests } = createStore();
        const warm = store.preloadFarm('SPACE');
        let warmSettled = false;
        void warm.then(() => { warmSettled = true; });
        await nextTurn();
        store.invalidateFarm('SPACE');
        const foreground = store.loadFarm('SPACE');
        await nextTurn();
        assert.equal(requests.length, 2);
        assert.equal(requests[1].background, false);
        const latest = farm('SPACE', '최신 일반 조회');

        if (order === '최신 먼저') {
          requests[1].resolve(latest);
          assert.equal(await foreground, latest);
        }
        const beforeOld = store.getFarmSnapshot('SPACE');
        if (outcome === '성공') {
          requests[0].resolve(farm('SPACE', '이전 preload 값'));
        } else {
          requests[0].reject(new Error('이전 preload 실패'));
        }
        await nextTurn();
        assert.equal(warmSettled, true);
        assert.equal(requests.length, 2);
        assert.equal(store.getFarmSnapshot('SPACE'), beforeOld);

        if (order === '이전 먼저') {
          const duplicate = store.loadFarm('SPACE', { force: true });
          await nextTurn();
          assert.equal(requests.length, 2);
          requests[1].resolve(latest);
          assert.equal(await foreground, latest);
          assert.equal(await duplicate, latest);
        }
        await warm;
        assert.equal(store.getFarmSnapshot('SPACE').farm, latest);
      });
    }
  }
});

test('세션 초기화 뒤 이전 preload 성공과 실패는 새 preload 시도와 캐시에 영향을 주지 않는다', async (t) => {
  for (const outcome of ['성공', '실패']) {
    await t.test(outcome, async () => {
      const { store, requests } = createStore();
      const oldWarm = store.preloadFarm('SPACE');
      await nextTurn();
      store.resetFarms();
      const newWarm = store.preloadFarm('SPACE');
      assert.notEqual(oldWarm, newWarm);
      await nextTurn();
      assert.equal(requests.length, 2);
      if (outcome === '성공') {
        requests[0].resolve(farm('SPACE', '이전 계정 준비 값'));
      } else {
        requests[0].reject(new Error('이전 계정 준비 실패'));
      }
      await oldWarm;
      assert.equal(store.getFarmSnapshot('SPACE').farm, null);
      assert.equal(store.getFarmSnapshot('SPACE').isLoading, true);
      assert.equal(store.preloadFarm('SPACE'), newWarm);
      const latest = farm('SPACE', '새 계정 준비 값');
      requests[1].resolve(latest);
      await newWarm;
      assert.equal(store.getFarmSnapshot('SPACE').farm, latest);
      assert.equal(requests.length, 2);
    });
  }
});

test('HTTP 전송 전에 세션이 초기화되면 이전 preload를 전송하지 않는다', async () => {
  const { store, requests } = createStore();
  const oldWarm = store.preloadFarm('SPACE');
  store.resetFarms();
  const newWarm = store.preloadFarm('SPACE');
  await nextTurn();
  await oldWarm;
  assert.equal(requests.length, 1);
  assert.equal(requests[0].background, true);
  const latest = farm('SPACE', '새 세션만 전송');
  requests[0].resolve(latest);
  await newWarm;
  assert.equal(store.getFarmSnapshot('SPACE').farm, latest);
});
