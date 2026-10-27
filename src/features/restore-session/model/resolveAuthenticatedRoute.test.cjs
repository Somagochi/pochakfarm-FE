const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const sourcePath = require.resolve('./resolveAuthenticatedRoute.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

function createHarness(token = { accessToken: 'access', refreshToken: 'refresh' }) {
  const profile = deferred();
  const images = deferred();
  const calls = [];
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: sourcePath,
  }).outputText;
  runInNewContext(source, {
    module,
    exports: module.exports,
    require(id) {
      if (id === '@/src/shared/lib/auth/tokenStorage') return { getServiceToken: async () => token };
      if (id === '@/src/entities/user') return {
        loadUserProfile(options) { calls.push(['profile', options.force]); return profile.promise; },
        resetUserProfile() { calls.push(['reset-profile']); },
      };
      assert.equal(id, '@/src/entities/farm');
      return {
        preloadFarm(type) { calls.push(['farm', type]); return images.promise; },
        resetFarms() { calls.push(['reset-farms']); },
      };
    },
  }, { filename: sourcePath });
  return { resolveRoute: module.exports.resolveAuthenticatedRoute, profile, images, calls };
}

test('토큰이 없으면 농장을 요청하지 않고 캐시를 초기화해 로그인으로 이동한다', async () => {
  const harness = createHarness(null);
  assert.equal(await harness.resolveRoute(), '/login');
  assert.deepEqual(harness.calls, [['reset-profile'], ['reset-farms']]);
});

test('프로필 응답을 기다리는 동안 땅 농장과 이미지 준비를 시작한다', async () => {
  const harness = createHarness();
  const route = harness.resolveRoute();
  let completed = false;
  void route.then(() => { completed = true; });
  await nextTurn();
  assert.deepEqual(harness.calls, [['profile', true], ['farm', 'GROUND']]);
  assert.equal(completed, false);
  harness.profile.resolve({ nickname: '농장 주인' });
  assert.equal(await route, '/(tabs)');
  // 이미지 준비 완료를 기다려 화면 진입을 다시 직렬화하지 않습니다.
  harness.images.resolve();
});

test('농장 준비가 먼저 끝나도 프로필 확인을 건너뛰지 않는다', async () => {
  const harness = createHarness();
  const route = harness.resolveRoute();
  let completed = false;
  void route.then(() => { completed = true; });
  harness.images.resolve();
  await nextTurn();
  assert.equal(completed, false);
  harness.profile.resolve({ nickname: '농장 주인' });
  assert.equal(await route, '/(tabs)');
});

test('프로필 확인이 실패하면 농장 준비 완료와 관계없이 로그인으로 이동한다', async () => {
  const harness = createHarness();
  const route = harness.resolveRoute();
  await nextTurn();
  harness.profile.reject(new Error('세션 확인 실패'));
  assert.equal(await route, '/login');
  harness.images.resolve();
});
