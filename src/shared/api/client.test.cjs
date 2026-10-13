const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const clientPath = require.resolve('./client.ts');
const FARM_PATH = '/api/farms/SPACE?page=0';
const REFRESH_URL = 'https://farm.test/api/auth/refresh';
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

function createClient(options = {}) {
  const state = {
    activeRequests: 0,
    startedRequests: 0,
    endedRequests: 0,
    authCalls: 0,
    clearCalls: 0,
    sessionExpirations: 0,
    session: 0,
    saves: [],
    fetchCalls: [],
    analytics: [],
    token: options.token === undefined
      ? { accessToken: 'old-access', refreshToken: 'old-refresh' }
      : options.token,
  };
  const steps = [...(options.fetchSteps ?? [])];
  const authGates = [...(options.authGates ?? [])];
  const tokenStorage = {
    getServiceTokenSession() { return state.session; },
    async getServiceToken() {
      state.authCalls += 1;
      if (options.authError) throw options.authError;
      const gate = authGates.shift();
      if (gate) await gate;
      return state.token;
    },
    async saveServiceToken(token, expectedSession) {
      if (expectedSession === undefined) state.session += 1;
      else if (expectedSession !== state.session) return;
      state.saves.push(token);
      state.token = token;
    },
    async clearServiceToken(expectedSession) {
      if (expectedSession !== undefined && expectedSession !== state.session) return;
      const clearingSession = ++state.session;
      state.clearCalls += 1;
      if (options.clearGate) await options.clearGate;
      if (clearingSession !== state.session) return;
      state.token = null;
      if (options.clearError) throw options.clearError;
    },
  };
  const mocks = {
    '@/src/shared/config/env': {
      env: { apiBaseUrl: options.apiBaseUrl ?? 'https://farm.test' },
    },
    '@/src/shared/api/requestActivity': {
      beginApiRequest() {
        state.activeRequests += 1;
        state.startedRequests += 1;
        return () => {
          state.endedRequests += 1;
          state.activeRequests -= 1;
          if (options.cleanupError) throw options.cleanupError;
        };
      },
    },
    '@/src/shared/lib/auth/tokenStorage': tokenStorage,
    '@/src/shared/lib/auth/sessionExpiration': {
      notifySessionExpired() { state.sessionExpirations += 1; },
    },
    '@/src/shared/lib/analytics': {
      captureAnalyticsEvent(name, attributes) { state.analytics.push({ name, attributes }); },
    },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(clientPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: clientPath,
  }).outputText;
  runInNewContext(source, {
    exports: module.exports,
    module,
    Error,
    Date,
    async fetch(url, init) {
      const step = steps.shift();
      assert.ok(step, `예정하지 않은 fetch: ${url}`);
      const call = { url, init, jsonCalls: 0 };
      state.fetchCalls.push(call);
      if (step.gate) await step.gate;
      if (step.error) throw step.error;
      const status = step.status ?? 200;
      return {
        status,
        ok: status >= 200 && status < 300,
        async json() {
          call.jsonCalls += 1;
          if (step.jsonGate) await step.jsonGate;
          if (step.jsonError) throw step.jsonError;
          return step.data;
        },
      };
    },
    require(id) {
      assert.ok(Object.hasOwn(mocks, id), `예정하지 않은 import: ${id}`);
      return mocks[id];
    },
  }, { filename: clientPath });
  return { client: module.exports.apiClient, ApiError: module.exports.ApiError, state, tokenStorage };
}

function assertCompleted(harness, blockingCount = 1) {
  assert.equal(harness.state.startedRequests, blockingCount);
  assert.equal(harness.state.endedRequests, blockingCount);
  assert.equal(harness.state.activeRequests, 0);
}

for (const method of ['get', 'getWithResponse']) {
  test(`${method}: 응답과 상태·인증·사용자 헤더 및 기존 성공 분석 이벤트를 보존한다`, async () => {
    const data = { data: { type: 'SPACE' } };
    const harness = createClient({ fetchSteps: [{ data }] });
    const result = await harness.client[method](FARM_PATH, { headers: { 'X-Client': 'farm' } });
    assert.equal(method === 'get' ? result : result.data, data);
    if (method === 'getWithResponse') assert.equal(result.status, 200);
    const call = harness.state.fetchCalls[0];
    assert.equal(call.init.method, 'GET');
    assert.equal(call.init.headers.Authorization, 'Bearer old-access');
    assert.equal(call.init.headers['X-Client'], 'farm');
    const event = harness.state.analytics[0];
    assert.equal(event.name, 'request_succeeded');
    assert.equal(event.attributes.endpoint, '/api/farms/SPACE');
    assert.equal(event.attributes.feature, 'farm');
    assert.equal(event.attributes.status, 200);
    assert.ok(event.attributes.duration_ms >= 0);
    assertCompleted(harness);
  });
}

test('토큰이 없는 일반 조회도 사용자 헤더를 보존하고 응답을 반환한다', async () => {
  const data = { guest: true };
  const harness = createClient({ token: null, fetchSteps: [{ data }] });
  assert.equal(await harness.client.get(FARM_PATH, { headers: { Accept: 'application/json' } }), data);
  assert.equal(harness.state.fetchCalls[0].init.headers.Accept, 'application/json');
  assert.equal(harness.state.fetchCalls[0].init.headers.Authorization, undefined);
  assertCompleted(harness);
});

for (const status of [403, 500]) {
  test(`HTTP ${status} 오류의 상태·코드·메시지와 실패 분석 이벤트를 보존한다`, async () => {
    const harness = createClient({ fetchSteps: [{ status, data: { message: '서버 오류 내용', data: { code: 'FARM_ERROR' } } }] });
    await assert.rejects(harness.client.get(FARM_PATH), (error) => {
      assert.ok(error instanceof harness.ApiError);
      assert.equal(error.status, status);
      assert.equal(error.code, 'FARM_ERROR');
      assert.equal(error.message, status === 500 ? '서버에 알 수 없는 에러가 발생했습니다.' : '서버 오류 내용');
      return true;
    });
    const event = harness.state.analytics[0];
    assert.equal(event.name, 'request_failed');
    assert.equal(event.attributes.error_category, status === 500 ? 'server' : 'client');
    assert.equal(event.attributes.error_code, 'FARM_ERROR');
    assert.equal(event.attributes.status, status);
    assertCompleted(harness);
  });
}

for (const stage of ['auth', 'fetch']) {
  test(`${stage} 실패는 원래 오류를 보존하고 요청 로딩을 해제한다`, async () => {
    const failure = new Error(`${stage} 연결 실패`);
    const harness = createClient(stage === 'auth' ? { authError: failure } : { fetchSteps: [{ error: failure }] });
    await assert.rejects(harness.client.get(FARM_PATH), (error) => error === failure);
    assert.equal(harness.state.fetchCalls.length, stage === 'auth' ? 0 : 1);
    assert.equal(harness.state.analytics[0].attributes.error_category, 'network_or_client');
    assertCompleted(harness);
  });
}

test('API 설정 오류는 인증과 HTTP 호출 없이 실패하고 로딩을 해제한다', async () => {
  const harness = createClient({ apiBaseUrl: '' });
  await assert.rejects(harness.client.get(FARM_PATH), /EXPO_PUBLIC_API_BASE_URL/);
  assert.equal(harness.state.authCalls, 0);
  assert.equal(harness.state.fetchCalls.length, 0);
  assert.equal(harness.state.analytics[0].name, 'request_failed');
  assertCompleted(harness);
});

test('401은 토큰을 갱신해 원래 요청을 한 번 재시도하고 사용자 헤더를 유지한다', async () => {
  const data = { farm: 'SPACE' };
  const harness = createClient({ fetchSteps: [
    { status: 401 }, { data: { accessToken: 'new-access' } }, { data },
  ] });
  assert.equal(await harness.client.get(FARM_PATH, { headers: { 'X-Client': 'farm' } }), data);
  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.fetchCalls[0].jsonCalls, 0);
  assert.equal(harness.state.fetchCalls[1].url, REFRESH_URL);
  assert.deepEqual(JSON.parse(harness.state.fetchCalls[1].init.body), { refreshToken: 'old-refresh' });
  assert.equal(harness.state.fetchCalls[2].init.headers.Authorization, 'Bearer new-access');
  assert.equal(harness.state.fetchCalls[2].init.headers['X-Client'], 'farm');
  assert.equal(harness.state.saves.length, 1);
  assert.equal(harness.state.token.refreshToken, 'old-refresh');
  assert.equal(harness.state.session, 0);
  assert.equal(harness.state.analytics.length, 1);
  assertCompleted(harness);
});

test('토큰 갱신 HTTP 실패는 토큰을 삭제하고 세션 만료를 통지한다', async () => {
  const harness = createClient({ fetchSteps: [{ status: 401 }, { status: 403, data: { message: '로그인 만료' } }] });
  await assert.rejects(harness.client.get(FARM_PATH), /로그인 만료/);
  assert.equal(harness.state.fetchCalls.length, 2);
  assert.equal(harness.state.clearCalls, 1);
  assert.equal(harness.state.token, null);
  assert.equal(harness.state.sessionExpirations, 1);
  assertCompleted(harness);
});

for (const stage of ['refresh', 'retry']) {
  test(`${stage} 연결 실패는 원래 오류를 보존하고 반복 갱신하지 않는다`, async () => {
    const failure = new Error(`${stage} 연결 실패`);
    const harness = createClient({ fetchSteps: stage === 'refresh'
      ? [{ status: 401 }, { error: failure }]
      : [{ status: 401 }, { data: { accessToken: 'new-access' } }, { error: failure }],
    });
    await assert.rejects(harness.client.get(FARM_PATH), (error) => error === failure);
    assert.equal(harness.state.clearCalls, 0);
    assert.equal(harness.state.sessionExpirations, 0);
    assertCompleted(harness);
  });
}

test('잘못된 갱신 응답은 토큰을 저장하거나 원래 요청을 재시도하지 않는다', async () => {
  const harness = createClient({ fetchSteps: [{ status: 401 }, { data: { refreshToken: 'invalid' } }] });
  await assert.rejects(harness.client.get(FARM_PATH), /토큰 재발급 응답/);
  assert.equal(harness.state.saves.length, 0);
  assert.equal(harness.state.fetchCalls.length, 2);
  assertCompleted(harness);
});

test('재시도도 401이면 ApiError를 반환하고 두 번째 갱신을 시작하지 않는다', async () => {
  const harness = createClient({ fetchSteps: [
    { status: 401 }, { data: { accessToken: 'new-access' } },
    { status: 401, data: { message: '접근 불가', code: 'TOKEN_INVALID' } },
  ] });
  await assert.rejects(harness.client.get(FARM_PATH), (error) => error instanceof harness.ApiError && error.status === 401 && error.code === 'TOKEN_INVALID');
  assert.equal(harness.state.fetchCalls.length, 3);
  assertCompleted(harness);
});

test('동시 401은 토큰 갱신을 공유하고 각 요청은 자기 응답과 로딩을 유지한다', async () => {
  const gate = deferred();
  const firstData = { farm: 'SPACE' };
  const secondData = { farm: 'GROUND' };
  const harness = createClient({ fetchSteps: [
    { status: 401 }, { status: 401 },
    { data: { accessToken: 'new-access' }, gate: gate.promise },
    { data: firstData }, { data: secondData },
  ] });
  const first = harness.client.get(FARM_PATH);
  const second = harness.client.get('/api/farms/GROUND?page=0');
  await nextTurn();
  assert.equal(harness.state.activeRequests, 2);
  assert.equal(harness.state.fetchCalls.filter((call) => call.url === REFRESH_URL).length, 1);
  gate.resolve();
  assert.deepEqual(await Promise.all([first, second]), [firstData, secondData]);
  assert.equal(harness.state.saves.length, 1);
  assertCompleted(harness, 2);
});

test('잘못된 JSON은 기존 동작대로 null을 반환한다', async () => {
  const harness = createClient({ fetchSteps: [{ jsonError: new Error('JSON 형식 오류') }] });
  const response = await harness.client.getWithResponse(FARM_PATH);
  assert.equal(response.data, null);
  assert.equal(response.status, 200);
  assertCompleted(harness);
});

test('요청 종료 처리 오류는 원래 오류를 유지한다', async () => {
  const failure = new Error('cleanup 실패');
  const harness = createClient({ cleanupError: failure, fetchSteps: [{ data: {} }] });
  await assert.rejects(harness.client.get(FARM_PATH), (error) => error === failure);
  assertCompleted(harness);
});

for (const method of ['get', 'getWithResponse']) {
  test(`${method}: background 조회는 인증·응답·분석을 유지하며 전역 로딩에서 제외한다`, async () => {
    const data = { farm: 'SPACE' };
    const harness = createClient({ fetchSteps: [{ data }] });
    const response = await harness.client[method](FARM_PATH, { affectsScreenLoading: false });
    assert.equal(method === 'get' ? response : response.data, data);
    assert.equal(harness.state.authCalls, 1);
    assert.equal(harness.state.fetchCalls[0].init.affectsScreenLoading, undefined);
    assert.equal(harness.state.analytics[0].name, 'request_succeeded');
    assertCompleted(harness, 0);
  });
}

test('affectsScreenLoading=true는 전역 로딩과 종료 처리를 유지한다', async () => {
  const harness = createClient({ fetchSteps: [{ data: {} }] });
  await harness.client.get(FARM_PATH, { affectsScreenLoading: true });
  assertCompleted(harness);
});

test('background 실패는 원래 오류와 실패 분석을 유지하며 전역 카운트를 변경하지 않는다', async () => {
  const failure = new Error('background 연결 실패');
  const harness = createClient({ fetchSteps: [{ error: failure }] });
  await assert.rejects(harness.client.get(FARM_PATH, { affectsScreenLoading: false }), (error) => error === failure);
  assert.equal(harness.state.analytics[0].name, 'request_failed');
  assertCompleted(harness, 0);
});

test('background 401도 토큰을 갱신하고 재시도하며 전역 로딩에 포함되지 않는다', async () => {
  const data = { farm: 'SPACE' };
  const harness = createClient({ fetchSteps: [
    { status: 401 }, { data: { accessToken: 'new-access' } }, { data },
  ] });
  assert.equal(await harness.client.get(FARM_PATH, { affectsScreenLoading: false }), data);
  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.saves.length, 1);
  assertCompleted(harness, 0);
});

test('background 완료는 동시에 진행 중인 foreground 요청의 로딩을 해제하지 않는다', async () => {
  const gate = deferred();
  const harness = createClient({ fetchSteps: [{ data: {}, gate: gate.promise }, { data: {} }] });
  const foreground = harness.client.get('/api/users/me');
  await nextTurn();
  await harness.client.get(FARM_PATH, { affectsScreenLoading: false });
  assert.equal(harness.state.activeRequests, 1);
  assert.equal(harness.state.endedRequests, 0);
  gate.resolve();
  await foreground;
  assertCompleted(harness);
});

test('토큰 삭제가 실패해도 기존 세션 만료 통지와 원래 오류를 유지한다', async () => {
  const failure = new Error('native token 삭제 실패');
  const harness = createClient({ clearError: failure, fetchSteps: [{ status: 401 }, { status: 403 }] });
  await assert.rejects(harness.client.get(FARM_PATH), (error) => error === failure);
  assert.equal(harness.state.sessionExpirations, 1);
  assertCompleted(harness);
});

test('기존 토큰 삭제를 기다리는 중 새 로그인하면 새 토큰과 세션을 유지한다', async () => {
  const gate = deferred();
  const harness = createClient({ clearGate: gate.promise, fetchSteps: [{ status: 401 }, { status: 403, data: { message: '이전 로그인 만료' } }] });
  const rejected = assert.rejects(harness.client.get(FARM_PATH), /이전 로그인 만료/);
  await nextTurn();
  assert.equal(harness.state.clearCalls, 1);
  const newToken = { accessToken: 'new-account', refreshToken: 'new-refresh' };
  await harness.tokenStorage.saveServiceToken(newToken);
  gate.resolve();
  await rejected;
  assert.equal(harness.state.token, newToken);
  assert.equal(harness.state.sessionExpirations, 0);
  assertCompleted(harness);
});

test('로그인 요청은 익명 흐름이므로 다른 세션 변경으로 응답을 거부하지 않는다', async () => {
  const gate = deferred();
  const data = { token: { accessToken: 'login-access' } };
  const harness = createClient({ fetchSteps: [{ data, gate: gate.promise }] });
  const request = harness.client.post('/api/auth/login', { provider: 'KAKAO' });
  await nextTurn();
  await harness.tokenStorage.saveServiceToken({ accessToken: 'other-session', refreshToken: 'other-refresh' });
  gate.resolve();
  assert.equal(await request, data);
  assert.equal(harness.state.authCalls, 0);
  assert.equal(harness.state.fetchCalls[0].init.headers.Authorization, undefined);
  assertCompleted(harness);
});

const NEW_ACCOUNT_TOKEN = { accessToken: 'account-b-access', refreshToken: 'account-b-refresh' };
const SESSION_CHANGED = /로그인 상태가 변경되었습니다/;

test('인증 정보를 기다리는 중 새 로그인하면 이전 요청을 HTTP에 보내지 않는다', async () => {
  const authGate = deferred();
  const harness = createClient({ authGates: [authGate.promise] });
  const request = harness.client.get(FARM_PATH);
  const rejected = assert.rejects(request, SESSION_CHANGED);
  await nextTurn();
  assert.equal(harness.state.authCalls, 1);
  await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
  authGate.resolve();
  await rejected;
  assert.equal(harness.state.fetchCalls.length, 0);
  assert.equal(harness.state.token, NEW_ACCOUNT_TOKEN);
  assert.equal(harness.state.sessionExpirations, 0);
  assertCompleted(harness);
});

test('새 로그인 뒤 도착한 이전 계정의 응답은 반환하거나 토큰을 갱신하지 않는다', async (t) => {
  for (const status of [200, 401]) {
    await t.test(String(status), async () => {
      const fetchGate = deferred();
      const harness = createClient({
        fetchSteps: [{ status, data: { owner: 'account-a' }, gate: fetchGate.promise }],
      });
      const request = harness.client.get(FARM_PATH);
      const rejected = assert.rejects(request, SESSION_CHANGED);
      await nextTurn();
      assert.equal(harness.state.fetchCalls.length, 1);
      await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
      fetchGate.resolve();
      await rejected;
      assert.equal(harness.state.fetchCalls.length, 1, '이전 계정의 401으로 새 refresh를 시작하지 않는다');
      assert.equal(harness.state.fetchCalls[0].jsonCalls, 0);
      assert.equal(harness.state.token, NEW_ACCOUNT_TOKEN);
      assert.equal(harness.state.clearCalls, 0);
      assert.equal(harness.state.sessionExpirations, 0);
      assertCompleted(harness);
    });
  }
});

test('이전 계정 응답의 JSON을 읽는 중 로그인하면 완료된 데이터도 반환하지 않는다', async () => {
  const jsonGate = deferred();
  const harness = createClient({
    fetchSteps: [{ data: { owner: 'account-a' }, jsonGate: jsonGate.promise }],
  });
  const rejected = assert.rejects(
    harness.client.get(FARM_PATH),
    SESSION_CHANGED,
  );
  await nextTurn();
  assert.equal(harness.state.fetchCalls[0].jsonCalls, 1);
  await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
  jsonGate.resolve();
  await rejected;
  assert.equal(harness.state.analytics.filter((event) => event.name === 'request_succeeded').length, 0);
  assert.equal(harness.state.token, NEW_ACCOUNT_TOKEN);
  assertCompleted(harness);
});

test('이전 계정 refresh의 늦은 성공·거절·연결 실패는 새 계정의 토큰과 세션을 건드리지 않는다', async (t) => {
  for (const outcome of ['success', 'http-error', 'network-error']) {
    await t.test(outcome, async () => {
      const refreshGate = deferred();
      const failure = new Error('이전 계정 refresh 연결 실패');
      const step = outcome === 'success'
        ? { data: { accessToken: 'stale-access', refreshToken: 'stale-refresh' } }
        : outcome === 'http-error'
          ? { status: 403, data: { message: '이전 계정 만료' } }
          : { error: failure };
      const harness = createClient({
        fetchSteps: [{ status: 401 }, { ...step, gate: refreshGate.promise }],
      });
      const request = harness.client.get(FARM_PATH);
      const rejected = assert.rejects(request, outcome === 'network-error'
        ? (error) => error === failure
        : SESSION_CHANGED);
      await nextTurn();
      assert.equal(harness.state.fetchCalls.length, 2);
      assert.equal(harness.state.fetchCalls[1].url, REFRESH_URL);
      await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
      refreshGate.resolve();
      await rejected;
      assert.equal(harness.state.token, NEW_ACCOUNT_TOKEN);
      assert.equal(harness.state.saves.length, 1, '새 로그인만 저장되고 이전 refresh는 저장하지 않는다');
      assert.equal(harness.state.clearCalls, 0);
      assert.equal(harness.state.sessionExpirations, 0);
      assert.equal(harness.state.fetchCalls.length, 2, '이전 계정 요청을 재시도하지 않는다');
      assertCompleted(harness);
    });
  }
});

test('refresh JSON이 늦게 완료되어도 새 로그인을 덮어쓰거나 원래 요청을 재시도하지 않는다', async () => {
  const jsonGate = deferred();
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { data: { accessToken: 'stale-access' }, jsonGate: jsonGate.promise },
    ],
  });
  const rejected = assert.rejects(
    harness.client.get(FARM_PATH),
    SESSION_CHANGED,
  );
  await nextTurn();
  assert.equal(harness.state.fetchCalls[1].jsonCalls, 1);
  await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
  jsonGate.resolve();
  await rejected;
  assert.equal(harness.state.token, NEW_ACCOUNT_TOKEN);
  assert.equal(harness.state.saves.length, 1);
  assert.equal(harness.state.fetchCalls.length, 2);
  assertCompleted(harness);
});

test('새 계정 401은 이전 refresh를 공유하지 않고 이전 완료가 새 refresh의 공유 상태를 지우지 않는다', async () => {
  const oldRefreshGate = deferred();
  const newRefreshGate = deferred();
  const firstData = { owner: 'account-b', farm: 'SPACE' };
  const secondData = { owner: 'account-b', farm: 'GROUND' };
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { data: { accessToken: 'stale-access' }, gate: oldRefreshGate.promise },
      { status: 401 },
      { data: { accessToken: 'account-b-refreshed', refreshToken: 'account-b-rotated' }, gate: newRefreshGate.promise },
      { status: 401 },
      { data: firstData },
      { data: secondData },
    ],
  });
  const oldRejected = assert.rejects(
    harness.client.get(FARM_PATH),
    SESSION_CHANGED,
  );
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 2);
  await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
  const first = harness.client.get(FARM_PATH);
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 4);
  assert.deepEqual(JSON.parse(harness.state.fetchCalls[3].init.body), { refreshToken: 'account-b-refresh' });

  oldRefreshGate.resolve();
  await oldRejected;
  const second = harness.client.get('/api/farms/GROUND?page=0');
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 5);
  assert.equal(harness.state.fetchCalls.filter((call) => call.url === REFRESH_URL).length, 2);

  newRefreshGate.resolve();
  const results = await Promise.all([first, second]);
  assert.equal(results[0], firstData);
  assert.equal(results[1], secondData);
  assert.equal(harness.state.fetchCalls.length, 7);
  assert.equal(harness.state.saves.length, 2, '로그인과 새 계정 refresh만 저장된다');
  assert.equal(harness.state.token.accessToken, 'account-b-refreshed');
  assert.equal(harness.state.session, 1, '같은 계정 refresh 저장은 epoch를 유지한다');
  assert.equal(harness.state.clearCalls, 0);
  assert.equal(harness.state.sessionExpirations, 0);
  for (const call of harness.state.fetchCalls.slice(5)) {
    assert.equal(call.init.headers.Authorization, 'Bearer account-b-refreshed');
  }
  assertCompleted(harness, 3);
});
