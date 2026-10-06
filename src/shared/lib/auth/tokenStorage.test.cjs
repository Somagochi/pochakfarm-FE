const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const storagePath = require.resolve('./tokenStorage.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const OLD_TOKEN = { accessToken: 'account-a-access', refreshToken: 'account-a-refresh' };
const NEW_TOKEN = { accessToken: 'account-b-access', refreshToken: 'account-b-refresh' };
const REFRESHED_TOKEN = { accessToken: 'account-a-refreshed', refreshToken: 'account-a-rotated' };

function createStorage(initialToken = OLD_TOKEN) {
  const values = new Map(initialToken ? Object.entries(initialToken) : []);
  const operations = [];

  function operation(kind, key, value) {
    let complete;
    let fail;
    const promise = new Promise((resolve, reject) => { complete = resolve; fail = reject; });
    const call = {
      kind, key, value, settled: false,
      resolve(...args) {
        assert.equal(call.settled, false, '같은 네이티브 작업을 두 번 완료하지 않는다');
        call.settled = true;
        if (kind === 'set') values.set(key, value);
        if (kind === 'remove') values.delete(key);
        complete(kind === 'get' ? (args.length ? args[0] : values.get(key) ?? null) : undefined);
      },
      reject(error) {
        assert.equal(call.settled, false);
        call.settled = true;
        fail(error);
      },
    };
    operations.push(call);
    return promise;
  }

  const asyncStorage = {
    getItem: (key) => operation('get', key),
    setItem: (key, value) => operation('set', key, value),
    removeItem: (key) => operation('remove', key),
  };
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(storagePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: storagePath,
  }).outputText;
  runInNewContext(source, {
    exports: module.exports,
    module,
    require(id) {
      assert.equal(id, '@react-native-async-storage/async-storage');
      return { default: asyncStorage };
    },
  }, { filename: storagePath });

  return {
    storage: module.exports,
    values,
    operations,
    pending(kind) { return operations.filter((call) => !call.settled && (!kind || call.kind === kind)); },
  };
}

async function completeAll(harness, promise) {
  let outcome;
  promise.then(
    (value) => { outcome = { value }; },
    (error) => { outcome = { error }; },
  );
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await nextTurn();
    if (outcome) {
      if (outcome.error) throw outcome.error;
      return outcome.value;
    }
    for (const call of harness.pending()) call.resolve();
  }
  assert.fail('네이티브 작업을 완료해도 tokenStorage Promise가 끝나지 않았다');
}

function assertStored(harness, token) {
  assert.equal(harness.values.get('accessToken') ?? null, token?.accessToken ?? null);
  assert.equal(harness.values.get('refreshToken') ?? null, token?.refreshToken ?? null);
}

async function assertRead(harness, token) {
  const actual = await completeAll(harness, harness.storage.getServiceToken());
  assert.deepEqual(actual && { ...actual }, token);
}

test('기존 await 저장·읽기·삭제 API는 두 토큰을 함께 처리하고 기본 변경의 epoch를 즉시 올린다', async () => {
  const harness = createStorage(null);
  const { storage } = harness;
  assert.equal(storage.getServiceTokenSession(), 0);
  await assertRead(harness, null);

  const saved = storage.saveServiceToken(NEW_TOKEN);
  assert.equal(storage.getServiceTokenSession(), 1, '네이티브 저장을 기다리기 전에 새 세션이 시작된다');
  await completeAll(harness, saved);
  assertStored(harness, NEW_TOKEN);
  await assertRead(harness, NEW_TOKEN);

  const cleared = storage.clearServiceToken();
  assert.equal(storage.getServiceTokenSession(), 2);
  await completeAll(harness, cleared);
  assertStored(harness, null);
  await assertRead(harness, null);
});

test('같은 세션의 guarded refresh 저장은 epoch를 유지하고 guarded 삭제는 세션을 만료시킨다', async () => {
  const harness = createStorage();
  const session = harness.storage.getServiceTokenSession();
  await completeAll(harness, harness.storage.saveServiceToken(REFRESHED_TOKEN, session));
  assert.equal(harness.storage.getServiceTokenSession(), session);
  await assertRead(harness, REFRESHED_TOKEN);

  const cleared = harness.storage.clearServiceToken(session);
  assert.equal(harness.storage.getServiceTokenSession(), session + 1);
  await completeAll(harness, cleared);
  await assertRead(harness, null);
});

test('이전 epoch의 guarded 저장·삭제는 새 로그인에 네이티브 작업을 추가하지 않는다', async () => {
  const harness = createStorage();
  const oldSession = harness.storage.getServiceTokenSession();
  await completeAll(harness, harness.storage.saveServiceToken(NEW_TOKEN));
  const operationCount = harness.operations.length;
  await harness.storage.saveServiceToken(REFRESHED_TOKEN, oldSession);
  await harness.storage.clearServiceToken(oldSession);
  assert.equal(harness.storage.getServiceTokenSession(), oldSession + 1);
  assert.equal(harness.operations.length, operationCount);
  assertStored(harness, NEW_TOKEN);
});

test('이미 시작한 refresh의 지연된 저장 뒤에 새 로그인 저장을 직렬 실행해 최신 토큰을 유지한다', async () => {
  const harness = createStorage();
  const refreshed = harness.storage.saveServiceToken(REFRESHED_TOKEN, 0);
  await nextTurn();
  const oldWrites = harness.pending('set');
  assert.equal(oldWrites.length, 2);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  await nextTurn();
  assert.equal(harness.operations.length, 2, '이전 쓰기들이 끝나기 전 새 계정 쓰기는 시작하지 않는다');

  oldWrites.find((call) => call.key === 'accessToken').resolve();
  await nextTurn();
  assert.equal(harness.operations.length, 2, '한 토큰의 완료만으로 큐가 풀리지 않는다');
  oldWrites.find((call) => call.key === 'refreshToken').resolve();
  await refreshed;
  await completeAll(harness, login);
  assertStored(harness, NEW_TOKEN);
  await assertRead(harness, NEW_TOKEN);
});

test('이미 시작한 이전 계정 삭제가 늦게 끝나도 새 로그인 저장을 뒤에 실행한다', async () => {
  const harness = createStorage();
  const clear = harness.storage.clearServiceToken(0);
  assert.equal(harness.storage.getServiceTokenSession(), 1);
  await nextTurn();
  const oldRemovals = harness.pending('remove');
  assert.equal(oldRemovals.length, 2);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  assert.equal(harness.storage.getServiceTokenSession(), 2);
  await nextTurn();
  assert.equal(harness.pending('set').length, 0);
  oldRemovals[0].resolve();
  await nextTurn();
  assert.equal(harness.pending('set').length, 0);
  oldRemovals[1].resolve();
  await clear;
  await completeAll(harness, login);
  assertStored(harness, NEW_TOKEN);
  await assertRead(harness, NEW_TOKEN);
});

test('큐에서 기다리던 이전 세션의 refresh 저장은 로그인 뒤 실행하지 않는다', async () => {
  const harness = createStorage();
  const first = harness.storage.saveServiceToken(OLD_TOKEN, 0);
  await nextTurn();
  const oldWrites = harness.pending('set');
  const queuedRefresh = harness.storage.saveServiceToken(REFRESHED_TOKEN, 0);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  for (const call of oldWrites) call.resolve();
  await first;
  await queuedRefresh;
  await completeAll(harness, login);
  assert.equal(harness.operations.filter((call) => call.kind === 'set').length, 4);
  assert.equal(harness.operations.some((call) => Object.values(REFRESHED_TOKEN).includes(call.value)), false);
  assertStored(harness, NEW_TOKEN);
});

test('한 토큰의 저장이 먼저 실패해도 다른 네이티브 쓰기가 끝난 뒤 새 로그인 저장을 시작한다', async () => {
  const harness = createStorage();
  const failure = new Error('accessToken 네이티브 저장 실패');
  const refreshed = harness.storage.saveServiceToken(REFRESHED_TOKEN, 0);
  const rejected = assert.rejects(refreshed, (error) => error === failure);
  let finished = false;
  rejected.then(() => { finished = true; });
  await nextTurn();
  const oldWrites = harness.pending('set');
  oldWrites.find((call) => call.key === 'accessToken').reject(failure);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  await nextTurn();
  assert.equal(finished, false, '먼저 발생한 실패로 나머지 네이티브 쓰기를 추월하지 않는다');
  assert.equal(harness.operations.length, 2);

  oldWrites.find((call) => call.key === 'refreshToken').resolve();
  await rejected;
  await completeAll(harness, login);
  assertStored(harness, NEW_TOKEN);
  await assertRead(harness, NEW_TOKEN);
});

test('한 토큰의 삭제 실패도 남은 네이티브 삭제와 새 계정 쓰기를 직렬로 끝낸다', async () => {
  const harness = createStorage();
  const failure = new Error('accessToken 네이티브 삭제 실패');
  const rejected = assert.rejects(harness.storage.clearServiceToken(0), (error) => error === failure);
  await nextTurn();
  const oldRemovals = harness.pending('remove');
  oldRemovals.find((call) => call.key === 'accessToken').reject(failure);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  await nextTurn();
  assert.equal(harness.pending('set').length, 0);
  oldRemovals.find((call) => call.key === 'refreshToken').resolve();
  await rejected;
  await completeAll(harness, login);
  assertStored(harness, NEW_TOKEN);
});

test('로그인 저장이 절반만 끝났을 때 읽기는 부분 토큰을 조회하거나 반환하지 않는다', async () => {
  const harness = createStorage();
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  await nextTurn();
  const writes = harness.pending('set');
  writes.find((call) => call.key === 'accessToken').resolve();
  assert.equal(harness.values.get('accessToken'), NEW_TOKEN.accessToken);
  assert.equal(harness.values.get('refreshToken'), OLD_TOKEN.refreshToken);
  let returned = false;
  const read = harness.storage.getServiceToken().then((token) => { returned = true; return token; });
  await nextTurn();
  assert.equal(returned, false);
  assert.equal(harness.pending('get').length, 0);
  writes.find((call) => call.key === 'refreshToken').resolve();
  await login;
  const token = await completeAll(harness, read);
  assert.deepEqual({ ...token }, NEW_TOKEN);
});

test('토큰을 읽던 중 로그인 epoch가 바뀌면 이전 읽기를 버리고 안정된 새 토큰 쌍을 읽는다', async () => {
  const harness = createStorage();
  const read = harness.storage.getServiceToken();
  await nextTurn();
  const oldReads = harness.pending('get');
  assert.equal(oldReads.length, 2);
  const login = harness.storage.saveServiceToken(NEW_TOKEN);
  await nextTurn();
  for (const call of harness.pending('set')) call.resolve();
  await login;
  for (const call of oldReads) call.resolve(OLD_TOKEN[call.key]);
  const token = await completeAll(harness, read);
  assert.deepEqual({ ...token }, NEW_TOKEN);
  assert.equal(harness.operations.filter((call) => call.kind === 'get').length, 4);
});

test('epoch가 같은 refresh 저장도 진행 중인 읽기를 다시 검사해 새 토큰 쌍을 반환한다', async () => {
  const harness = createStorage();
  const read = harness.storage.getServiceToken();
  await nextTurn();
  const oldReads = harness.pending('get');
  const refresh = harness.storage.saveServiceToken(REFRESHED_TOKEN, 0);
  await nextTurn();
  for (const call of harness.pending('set')) call.resolve();
  await refresh;
  assert.equal(harness.storage.getServiceTokenSession(), 0);
  for (const call of oldReads) call.resolve(OLD_TOKEN[call.key]);
  const token = await completeAll(harness, read);
  assert.deepEqual({ ...token }, REFRESHED_TOKEN);
  assert.equal(harness.operations.filter((call) => call.kind === 'get').length, 4);
});

test('토큰을 읽던 중 로그아웃하면 이전 쌍을 반환하지 않고 삭제 완료 뒤 null을 반환한다', async () => {
  const harness = createStorage();
  const read = harness.storage.getServiceToken();
  await nextTurn();
  const oldReads = harness.pending('get');
  const clear = harness.storage.clearServiceToken();
  await nextTurn();
  for (const call of harness.pending('remove')) call.resolve();
  await clear;
  for (const call of oldReads) call.resolve(OLD_TOKEN[call.key]);
  assert.equal(await completeAll(harness, read), null);
  assertStored(harness, null);
});

test('둘 중 한 토큰이 없으면 불완전한 인증 쌍을 반환하지 않는다', async (t) => {
  for (const missing of ['accessToken', 'refreshToken']) {
    await t.test(missing, async () => {
      const harness = createStorage();
      harness.values.delete(missing);
      await assertRead(harness, null);
    });
  }
});
