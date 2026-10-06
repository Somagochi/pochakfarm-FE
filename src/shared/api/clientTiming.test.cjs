const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const clientPath = require.resolve('./client.ts');
const timingPath = require.resolve('./requestTiming.ts');
const FARM_PATH = '/api/farms/SPACE?page=0';
const REFRESH_URL = 'https://farm.test/api/auth/refresh';
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const PHASES = [
  'setup_ms', 'auth_ms', 'fetch_ms', 'refresh_ms',
  'retry_ms', 'json_ms', 'postprocess_ms',
];

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

function createClient(options = {}) {
  let now = 0;
  const state = {
    activeRequests: 0,
    startedRequests: 0,
    endedRequests: 0,
    clockReads: 0,
    authCalls: 0,
    clearCalls: 0,
    sessionExpirations: 0,
    session: 0,
    saves: [],
    fetchCalls: [],
    analytics: [],
    reports: [],
    observerStates: [],
    logs: [],
    token: options.token === undefined
      ? { accessToken: 'old-access', refreshToken: 'old-refresh' }
      : options.token,
  };
  const steps = [...(options.fetchSteps ?? [])];
  const authGates = [...(options.authGates ?? [])];
  const modules = new Map();
  const advance = (duration) => { now += duration; };
  const mocks = {
    '@/src/shared/config/env': {
      env: { apiBaseUrl: options.apiBaseUrl ?? 'https://farm.test' },
    },
    '@/src/shared/api/requestActivity': {
      beginApiRequest() {
        state.activeRequests += 1;
        state.startedRequests += 1;
        advance(7);
        return () => {
          state.endedRequests += 1;
          state.activeRequests -= 1;
          advance(1);
          if (options.cleanupError) throw options.cleanupError;
        };
      },
    },
    '@/src/shared/lib/auth/tokenStorage': {
      getServiceTokenSession() { return state.session; },
      async getServiceToken() {
        state.authCalls += 1;
        advance(3);
        if (options.authError) throw options.authError;
        const gate = authGates.shift();
        if (gate) await gate;
        return state.token;
      },
      async saveServiceToken(token, expectedSession) {
        if (expectedSession === undefined) state.session += 1;
        else if (expectedSession !== state.session) return;
        advance(4);
        state.saves.push(token);
        state.token = token;
      },
      async clearServiceToken(expectedSession) {
        if (expectedSession !== undefined && expectedSession !== state.session) return;
        state.session += 1;
        advance(2);
        state.clearCalls += 1;
        state.token = null;
      },
    },
    '@/src/shared/lib/auth/sessionExpiration': {
      notifySessionExpired() { state.sessionExpirations += 1; },
    },
    '@/src/shared/lib/analytics': {
      captureAnalyticsEvent(name, attributes) {
        advance(2);
        state.analytics.push({ name, attributes });
      },
    },
  };

  function loadModule(filePath) {
    if (modules.has(filePath)) return modules.get(filePath);
    const module = { exports: {} };
    modules.set(filePath, module.exports);
    const source = ts.transpileModule(readFileSync(filePath, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: filePath,
    }).outputText;

    runInNewContext(source, {
      exports: module.exports,
      module,
      Error,
      Date: { now: () => now },
      performance: {
        now() {
          state.clockReads += 1;
          return now;
        },
      },
      console: {
        log(...args) { state.logs.push(args); },
        info(...args) { state.logs.push(args); },
        warn(...args) { state.logs.push(args); },
        error(...args) { state.logs.push(args); },
      },
      async fetch(url, init) {
        const step = steps.shift();
        assert.ok(step, `예정하지 않은 fetch: ${url}`);
        const call = { url, init, jsonCalls: 0 };
        state.fetchCalls.push(call);
        if (step.gate) await step.gate;
        advance(step.fetchMs ?? 11);
        if (step.error) throw step.error;

        const status = step.status ?? 200;
        return {
          status,
          ok: status >= 200 && status < 300,
          async json() {
            call.jsonCalls += 1;
            if (step.jsonGate) await step.jsonGate;
            advance(step.jsonMs ?? 5);
            if (step.jsonError) throw step.jsonError;
            return step.data;
          },
        };
      },
      require(id) {
        if (Object.hasOwn(mocks, id)) return mocks[id];
        assert.equal(id, './requestTiming');
        return loadModule(timingPath);
      },
    }, { filename: filePath });
    return module.exports;
  }

  const { apiClient, ApiError } = loadModule(clientPath);
  return {
    client: apiClient,
    ApiError,
    state,
    tokenStorage: mocks['@/src/shared/lib/auth/tokenStorage'],
    observe(timing) {
      state.reports.push(timing);
      state.observerStates.push({
        activeRequests: state.activeRequests,
        endedRequests: state.endedRequests,
      });
      if (options.observerError) throw options.observerError;
    },
  };
}

function assertTiming(report, expected) {
  assert.ok(report);
  for (const field of PHASES) {
    assert.ok(Object.hasOwn(report, field));
    if (report[field] !== null) {
      assert.equal(typeof report[field], 'number');
      assert.ok(Number.isFinite(report[field]));
      assert.ok(report[field] >= 0);
    }
  }
  for (const [field, value] of Object.entries(expected)) {
    assert.equal(report[field], value, field);
  }
  assert.equal(
    report.total_ms,
    PHASES.reduce((sum, field) => sum + (report[field] ?? 0), 0),
    '정수 시계에서 단계 합은 요청 총 시간과 일치해야 한다',
  );
}

function assertCompleted(harness, count = 1, blockingCount = count) {
  assert.equal(harness.state.startedRequests, blockingCount);
  assert.equal(harness.state.endedRequests, blockingCount);
  assert.equal(harness.state.activeRequests, 0);
  assert.equal(harness.state.reports.length, count);
  assert.equal(harness.state.observerStates.length, count);
  for (const observerState of harness.state.observerStates) {
    assert.ok(observerState.endedRequests <= blockingCount);
  }
  assert.equal(harness.state.observerStates.at(-1).activeRequests, 0);
}

const NORMAL_TIMING = {
  setup_ms: 7,
  auth_ms: 3,
  fetch_ms: 11,
  refresh_ms: null,
  retry_ms: null,
  json_ms: 5,
  postprocess_ms: 3,
  total_ms: 29,
  initial_status: 200,
  final_status: 200,
  token_refresh_attempted: false,
};

for (const method of ['get', 'getWithResponse']) {
  test(`${method}: 응답을 보존하고 인증·HTTP·JSON·cleanup 시간을 한 번 보고한다`, async () => {
    const data = { data: { type: 'SPACE', floors: [] }, datetime: 'example' };
    const harness = createClient({ fetchSteps: [{ data }] });
    const result = await harness.client[method](FARM_PATH, {
      headers: { 'X-Test': 'preserved' },
      onRequestTiming: harness.observe,
    });

    if (method === 'get') {
      assert.equal(result, data);
    } else {
      assert.equal(result.data, data);
      assert.equal(result.status, 200);
    }
    assert.equal(harness.state.fetchCalls.length, 1);
    const request = harness.state.fetchCalls[0];
    assert.equal(request.url, `https://farm.test${FARM_PATH}`);
    assert.equal(request.init.method, 'GET');
    assert.equal(request.init.headers.Authorization, 'Bearer old-access');
    assert.equal(request.init.headers['X-Test'], 'preserved');
    assert.equal(request.init.onRequestTiming, undefined);
    assert.equal(request.jsonCalls, 1);
    assert.equal(harness.state.authCalls, 1);
    assert.equal(harness.state.saves.length, 0);
    assert.equal(harness.state.analytics[0].name, 'request_succeeded');
    assert.equal(harness.state.analytics[0].attributes.endpoint, '/api/farms/SPACE');
    assertTiming(harness.state.reports[0], NORMAL_TIMING);
    assertCompleted(harness);
  });
}

test('타이밍 observer가 없으면 시계를 읽거나 진단 로그를 남기지 않는다', async () => {
  const data = { data: { type: 'SPACE' } };
  const harness = createClient({ fetchSteps: [{ data }] });
  assert.equal(await harness.client.get(FARM_PATH), data);
  assert.equal(harness.state.clockReads, 0);
  assert.equal(harness.state.reports.length, 0);
  assert.equal(harness.state.logs.length, 0);
  assert.equal(harness.state.fetchCalls.length, 1);
  assert.equal(harness.state.endedRequests, 1);
  assert.equal(harness.state.activeRequests, 0);
});

test('HTTP 오류의 상태·코드·메시지를 보존하고 JSON 및 오류 처리 시간을 보고한다', async () => {
  const harness = createClient({
    fetchSteps: [{ status: 403, data: { data: { message: '농장 접근 불가', code: 'FARM_DENIED' } } }],
  });
  await assert.rejects(harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }), (error) => {
    assert.ok(error instanceof harness.ApiError);
    assert.equal(error.status, 403);
    assert.equal(error.code, 'FARM_DENIED');
    assert.equal(error.message, '농장 접근 불가');
    return true;
  });
  assertTiming(harness.state.reports[0], {
    ...NORMAL_TIMING,
    initial_status: 403,
    final_status: 403,
  });
  assert.equal(harness.state.analytics[0].name, 'request_failed');
  assert.equal(harness.state.fetchCalls.length, 1);
  assertCompleted(harness);
});

test('인증 또는 HTTP 연결 실패는 원래 오류를 보존하고 실행하지 않은 단계를 null로 남긴다', async (t) => {
  for (const phase of ['auth', 'fetch']) {
    await t.test(phase, async () => {
      const failure = new Error(`${phase} 연결 실패`);
      const harness = createClient(phase === 'auth'
        ? { authError: failure }
        : { fetchSteps: [{ error: failure }] });
      await assert.rejects(
        harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
        (error) => error === failure,
      );
      assertTiming(harness.state.reports[0], {
        setup_ms: 7,
        auth_ms: 3,
        fetch_ms: phase === 'fetch' ? 11 : null,
        refresh_ms: null,
        retry_ms: null,
        json_ms: null,
        postprocess_ms: 3,
        total_ms: phase === 'fetch' ? 24 : 13,
        initial_status: null,
        final_status: null,
        token_refresh_attempted: false,
      });
      assert.equal(harness.state.fetchCalls.length, phase === 'fetch' ? 1 : 0);
      assert.equal(harness.state.saves.length, 0);
      assertCompleted(harness);
    });
  }
});

test('설정 오류도 cleanup 뒤에 보고하고 인증과 fetch를 실행하지 않는다', async () => {
  const harness = createClient({ apiBaseUrl: '' });
  await assert.rejects(
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
    /EXPO_PUBLIC_API_BASE_URL/,
  );
  assertTiming(harness.state.reports[0], {
    setup_ms: 7,
    auth_ms: null,
    fetch_ms: null,
    refresh_ms: null,
    retry_ms: null,
    json_ms: null,
    postprocess_ms: 3,
    total_ms: 10,
    initial_status: null,
    final_status: null,
    token_refresh_attempted: false,
  });
  assert.equal(harness.state.authCalls, 0);
  assert.equal(harness.state.fetchCalls.length, 0);
  assertCompleted(harness);
});

test('401 토큰 갱신과 재시도의 시간을 분리하고 새 토큰으로 원래 요청을 한 번 재시도한다', async () => {
  const data = { data: { type: 'SPACE', floors: [] } };
  const harness = createClient({
    fetchSteps: [
      { status: 401, data: { message: '토큰 만료' } },
      { data: { data: { token: { accessToken: 'new-access', refreshToken: 'new-refresh' } } }, fetchMs: 13, jsonMs: 7 },
      { data, fetchMs: 17 },
    ],
  });
  assert.equal(await harness.client.get(FARM_PATH, {
    headers: { 'X-Test': 'preserved' },
    onRequestTiming: harness.observe,
  }), data);

  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.fetchCalls[0].jsonCalls, 0);
  const refresh = harness.state.fetchCalls[1];
  assert.equal(refresh.url, REFRESH_URL);
  assert.equal(refresh.init.method, 'POST');
  assert.deepEqual(JSON.parse(refresh.init.body), { refreshToken: 'old-refresh' });
  const retry = harness.state.fetchCalls[2];
  assert.equal(retry.url, `https://farm.test${FARM_PATH}`);
  assert.equal(retry.init.headers.Authorization, 'Bearer new-access');
  assert.equal(retry.init.headers['X-Test'], 'preserved');
  assert.equal(retry.jsonCalls, 1);
  assert.deepEqual({ ...harness.state.saves[0] }, { accessToken: 'new-access', refreshToken: 'new-refresh' });
  assert.equal(harness.state.saves.length, 1);
  assert.equal(harness.state.authCalls, 2);
  assertTiming(harness.state.reports[0], {
    ...NORMAL_TIMING,
    refresh_ms: 27,
    retry_ms: 17,
    total_ms: 73,
    initial_status: 401,
    final_status: 200,
    token_refresh_attempted: true,
  });
  assertCompleted(harness);
});

test('토큰 갱신 HTTP 실패는 세션 만료 처리를 보존하고 최종 응답 상태를 null로 보고한다', async () => {
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { status: 403, data: { message: '재발급 거절' }, fetchMs: 13, jsonMs: 7 },
    ],
  });
  await assert.rejects(
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
    /재발급 거절/,
  );
  assert.equal(harness.state.fetchCalls.length, 2);
  assert.equal(harness.state.clearCalls, 1);
  assert.equal(harness.state.sessionExpirations, 1);
  assert.equal(harness.state.saves.length, 0);
  assertTiming(harness.state.reports[0], {
    setup_ms: 7,
    auth_ms: 3,
    fetch_ms: 11,
    refresh_ms: 25,
    retry_ms: null,
    json_ms: null,
    postprocess_ms: 3,
    total_ms: 49,
    initial_status: 401,
    final_status: null,
    token_refresh_attempted: true,
  });
  assertCompleted(harness);
});

test('갱신 또는 재시도 연결 실패의 원래 오류와 실패 단계 시간을 보존한다', async (t) => {
  for (const phase of ['refresh', 'retry']) {
    await t.test(phase, async () => {
      const failure = new Error(`${phase} 연결 실패`);
      const steps = [
        { status: 401 },
        phase === 'refresh'
          ? { error: failure, fetchMs: 13 }
          : { data: { accessToken: 'new-access' }, fetchMs: 13, jsonMs: 7 },
      ];
      if (phase === 'retry') steps.push({ error: failure, fetchMs: 17 });
      const harness = createClient({ fetchSteps: steps });
      await assert.rejects(
        harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
        (error) => error === failure,
      );
      assertTiming(harness.state.reports[0], {
        setup_ms: 7,
        auth_ms: 3,
        fetch_ms: 11,
        refresh_ms: phase === 'refresh' ? 16 : 27,
        retry_ms: phase === 'retry' ? 17 : null,
        json_ms: null,
        postprocess_ms: 3,
        total_ms: phase === 'refresh' ? 40 : 68,
        initial_status: 401,
        final_status: null,
        token_refresh_attempted: true,
      });
      assert.equal(harness.state.fetchCalls.length, phase === 'refresh' ? 2 : 3);
      assert.equal(harness.state.saves.length, phase === 'refresh' ? 0 : 1);
      assert.equal(harness.state.clearCalls, 0);
      assert.equal(harness.state.sessionExpirations, 0);
      if (phase === 'retry') {
        assert.equal(harness.state.saves[0].refreshToken, 'old-refresh');
      }
      assertCompleted(harness);
    });
  }
});

test('재시도 HTTP 오류는 최종 상태와 ApiError를 보존하고 반복 재발급하지 않는다', async () => {
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { data: { accessToken: 'new-access' }, fetchMs: 13, jsonMs: 7 },
      { status: 401, data: { message: '갱신 토큰도 거절', code: 'RETRY_DENIED' }, fetchMs: 17 },
    ],
  });
  await assert.rejects(harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }), (error) => {
    assert.ok(error instanceof harness.ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.code, 'RETRY_DENIED');
    assert.equal(error.message, '갱신 토큰도 거절');
    return true;
  });
  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.saves.length, 1);
  assertTiming(harness.state.reports[0], {
    ...NORMAL_TIMING,
    refresh_ms: 27,
    retry_ms: 17,
    total_ms: 73,
    initial_status: 401,
    final_status: 401,
    token_refresh_attempted: true,
  });
  assertCompleted(harness);
});

test('동시 401은 토큰 갱신을 공유하고 각 원래 요청의 대기·재시도 및 cleanup을 따로 보고한다', async () => {
  const refreshGate = deferred();
  const firstData = { data: { type: 'SPACE' } };
  const secondData = { data: { type: 'GROUND' } };
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { status: 401 },
      { data: { accessToken: 'shared-access', refreshToken: 'shared-refresh' }, fetchMs: 13, jsonMs: 7, gate: refreshGate.promise },
      { data: firstData, fetchMs: 17 },
      { data: secondData, fetchMs: 19 },
    ],
  });
  const first = harness.client.get(FARM_PATH, { onRequestTiming: harness.observe });
  const second = harness.client.get('/api/farms/GROUND?page=0', { onRequestTiming: harness.observe });
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.fetchCalls.filter((call) => call.url === REFRESH_URL).length, 1);
  assert.equal(harness.state.activeRequests, 2);
  assert.equal(harness.state.endedRequests, 0);
  assert.equal(harness.state.reports.length, 0);

  refreshGate.resolve();
  const results = await Promise.all([first, second]);
  assert.equal(results[0], firstData);
  assert.equal(results[1], secondData);
  assert.equal(harness.state.fetchCalls.length, 5);
  assert.equal(harness.state.fetchCalls.filter((call) => call.url === REFRESH_URL).length, 1);
  assert.equal(harness.state.saves.length, 1);
  assert.equal(harness.state.authCalls, 3);
  for (const retry of harness.state.fetchCalls.slice(3)) {
    assert.equal(retry.init.headers.Authorization, 'Bearer shared-access');
    assert.equal(retry.jsonCalls, 1);
  }
  for (const report of harness.state.reports) {
    assertTiming(report, {
      initial_status: 401,
      final_status: 200,
      token_refresh_attempted: true,
    });
    assert.ok(report.refresh_ms > 0);
    assert.ok(report.retry_ms > 0);
  }
  assertCompleted(harness, 2);
  assert.deepEqual(harness.state.observerStates.map((state) => state.endedRequests), [1, 2]);
});

test('잘못된 JSON은 기존 동작대로 null을 반환하고 JSON 소요 시간은 남긴다', async () => {
  const harness = createClient({
    fetchSteps: [{ jsonError: new SyntaxError('잘못된 JSON') }],
  });
  const response = await harness.client.getWithResponse(FARM_PATH, { onRequestTiming: harness.observe });
  assert.equal(response.data, null);
  assert.equal(response.status, 200);
  assert.equal(harness.state.fetchCalls[0].jsonCalls, 1);
  assertTiming(harness.state.reports[0], NORMAL_TIMING);
  assertCompleted(harness);
});

test('observer 예외는 성공 응답이나 원래 요청 오류를 바꾸지 않는다', async (t) => {
  await t.test('성공', async () => {
    const data = { data: { type: 'SPACE' } };
    const harness = createClient({
      fetchSteps: [{ data }],
      observerError: new Error('로그 기록 실패'),
    });
    assert.equal(await harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }), data);
    assert.equal(harness.state.analytics.length, 1);
    assertTiming(harness.state.reports[0], NORMAL_TIMING);
    assertCompleted(harness);
  });
  await t.test('실패', async () => {
    const failure = new Error('원래 fetch 오류');
    const harness = createClient({
      fetchSteps: [{ error: failure }],
      observerError: new Error('로그 기록 실패'),
    });
    await assert.rejects(
      harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
      (error) => error === failure,
    );
    assert.equal(harness.state.analytics.length, 1);
    assert.equal(harness.state.reports[0].fetch_ms, 11);
    assertCompleted(harness);
  });
});

test('cleanup이 실패해도 observer는 한 번 호출하고 원래 cleanup 오류를 보존한다', async () => {
  const failure = new Error('cleanup 실패');
  const harness = createClient({
    fetchSteps: [{ data: { data: { type: 'SPACE' } } }],
    cleanupError: failure,
    observerError: new Error('observer 실패'),
  });
  await assert.rejects(
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
    (error) => error === failure,
  );
  assertTiming(harness.state.reports[0], NORMAL_TIMING);
  assertCompleted(harness);
});

for (const method of ['get', 'getWithResponse']) {
  test(`${method}: affectsScreenLoading=false는 인증·HTTP·타이밍을 유지하고 전역 로딩만 제외한다`, async () => {
    const data = { data: { type: 'SPACE' } };
    const harness = createClient({ fetchSteps: [{ data }] });
    const result = await harness.client[method](FARM_PATH, {
      affectsScreenLoading: false,
      headers: { 'X-Test': 'preserved' },
      onRequestTiming: harness.observe,
    });
    assert.equal(method === 'get' ? result : result.data, data);
    if (method === 'getWithResponse') assert.equal(result.status, 200);
    assert.equal(harness.state.fetchCalls.length, 1);
    const call = harness.state.fetchCalls[0];
    assert.equal(call.init.headers.Authorization, 'Bearer old-access');
    assert.equal(call.init.headers['X-Test'], 'preserved');
    assert.equal(call.init.affectsScreenLoading, undefined);
    assert.equal(call.jsonCalls, 1);
    assert.equal(harness.state.analytics[0].name, 'request_succeeded');
    assertTiming(harness.state.reports[0], {
      ...NORMAL_TIMING,
      setup_ms: 0,
      postprocess_ms: 2,
      total_ms: 21,
    });
    assertCompleted(harness, 1, 0);
  });
}

test('affectsScreenLoading=true는 기존 전역 로딩과 cleanup을 유지한다', async () => {
  const data = { data: { type: 'GROUND' } };
  const harness = createClient({ fetchSteps: [{ data }] });
  assert.equal(await harness.client.get(FARM_PATH, {
    affectsScreenLoading: true,
    onRequestTiming: harness.observe,
  }), data);
  assertTiming(harness.state.reports[0], NORMAL_TIMING);
  assertCompleted(harness);
});

test('background 요청 실패는 오류와 분석·타이밍을 유지하고 전역 로딩 계수를 변경하지 않는다', async () => {
  const failure = new Error('background 연결 실패');
  const harness = createClient({ fetchSteps: [{ error: failure }] });
  await assert.rejects(harness.client.get(FARM_PATH, {
    affectsScreenLoading: false,
    onRequestTiming: harness.observe,
  }), (error) => error === failure);
  assert.equal(harness.state.analytics[0].name, 'request_failed');
  assertTiming(harness.state.reports[0], {
    setup_ms: 0,
    auth_ms: 3,
    fetch_ms: 11,
    refresh_ms: null,
    retry_ms: null,
    json_ms: null,
    postprocess_ms: 2,
    total_ms: 16,
    initial_status: null,
    final_status: null,
    token_refresh_attempted: false,
  });
  assertCompleted(harness, 1, 0);
});

test('background 401도 토큰을 갱신하고 재시도하며 전역 로딩에는 포함되지 않는다', async () => {
  const data = { data: { type: 'SPACE' } };
  const harness = createClient({
    fetchSteps: [
      { status: 401 },
      { data: { accessToken: 'new-access' }, fetchMs: 13, jsonMs: 7 },
      { data, fetchMs: 17 },
    ],
  });
  assert.equal(await harness.client.get(FARM_PATH, {
    affectsScreenLoading: false,
    onRequestTiming: harness.observe,
  }), data);
  assert.equal(harness.state.fetchCalls.length, 3);
  assert.equal(harness.state.saves.length, 1);
  assert.equal(harness.state.fetchCalls[2].init.headers.Authorization, 'Bearer new-access');
  assertTiming(harness.state.reports[0], {
    ...NORMAL_TIMING,
    setup_ms: 0,
    refresh_ms: 27,
    retry_ms: 17,
    postprocess_ms: 2,
    total_ms: 65,
    initial_status: 401,
    final_status: 200,
    token_refresh_attempted: true,
  });
  assertCompleted(harness, 1, 0);
});

test('background 완료는 동시에 진행 중인 일반 요청의 전역 로딩을 해제하지 않는다', async () => {
  const blockingGate = deferred();
  const blockingData = { data: { type: 'GROUND' } };
  const backgroundData = { data: { type: 'SPACE' } };
  const harness = createClient({
    fetchSteps: [
      { data: blockingData, gate: blockingGate.promise },
      { data: backgroundData },
    ],
  });
  const blocking = harness.client.get('/api/farms/GROUND?page=0', { onRequestTiming: harness.observe });
  const background = harness.client.get(FARM_PATH, {
    affectsScreenLoading: false,
    onRequestTiming: harness.observe,
  });
  assert.equal(await background, backgroundData);
  assert.equal(harness.state.startedRequests, 1);
  assert.equal(harness.state.endedRequests, 0);
  assert.equal(harness.state.activeRequests, 1);
  assert.equal(harness.state.reports.length, 1);
  assert.deepEqual(harness.state.observerStates[0], { activeRequests: 1, endedRequests: 0 });

  blockingGate.resolve();
  assert.equal(await blocking, blockingData);
  for (const report of harness.state.reports) {
    assertTiming(report, { initial_status: 200, final_status: 200, token_refresh_attempted: false });
  }
  assertCompleted(harness, 2, 1);
});

test('타이밍 observer 없는 background 요청도 진단 시계나 전역 로딩을 사용하지 않는다', async () => {
  const data = { data: { type: 'SPACE' } };
  const harness = createClient({ fetchSteps: [{ data }] });
  assert.equal(await harness.client.get(FARM_PATH, { affectsScreenLoading: false }), data);
  assert.equal(harness.state.clockReads, 0);
  assert.equal(harness.state.logs.length, 0);
  assert.equal(harness.state.startedRequests, 0);
  assert.equal(harness.state.endedRequests, 0);
  assert.equal(harness.state.activeRequests, 0);
  assert.equal(harness.state.reports.length, 0);
  assert.equal(harness.state.analytics[0].name, 'request_succeeded');
});

const NEW_ACCOUNT_TOKEN = { accessToken: 'account-b-access', refreshToken: 'account-b-refresh' };
const SESSION_CHANGED = /로그인 상태가 변경되었습니다/;

test('인증 정보를 기다리는 중 새 로그인하면 이전 요청을 HTTP에 보내지 않는다', async () => {
  const authGate = deferred();
  const harness = createClient({ authGates: [authGate.promise] });
  const request = harness.client.get(FARM_PATH, { onRequestTiming: harness.observe });
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
      const request = harness.client.get(FARM_PATH, { onRequestTiming: harness.observe });
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
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
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
      const request = harness.client.get(FARM_PATH, { onRequestTiming: harness.observe });
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
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
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
    harness.client.get(FARM_PATH, { onRequestTiming: harness.observe }),
    SESSION_CHANGED,
  );
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 2);
  await harness.tokenStorage.saveServiceToken(NEW_ACCOUNT_TOKEN);
  const first = harness.client.get(FARM_PATH, { onRequestTiming: harness.observe });
  await nextTurn();
  assert.equal(harness.state.fetchCalls.length, 4);
  assert.deepEqual(JSON.parse(harness.state.fetchCalls[3].init.body), { refreshToken: 'account-b-refresh' });

  oldRefreshGate.resolve();
  await oldRejected;
  const second = harness.client.get('/api/farms/GROUND?page=0', { onRequestTiming: harness.observe });
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
