const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const cachePath = require.resolve('./preparedImageCache.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const URI = 'https://images.test/animal.png?signature=first';
const SIZE = { maxWidth: 80, maxHeight: 73 };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

function createCache(options = {}) {
  const state = {
    paths: new Map(options.paths ?? []),
    cacheCalls: [],
    loadCalls: [],
    released: [],
  };
  const image = (width = 80, height = 73, scale = 1) => ({
    width, height, scale,
    release() { state.released.push(this); },
  });
  const ExpoImage = {
    async getCachePathAsync(uri) {
      state.cacheCalls.push(uri);
      return options.getPath ? options.getPath(uri, state) : state.paths.get(uri) ?? null;
    },
    async loadAsync(source, size) {
      const call = { source, size: { ...size } };
      state.loadCalls.push(call);
      if (options.load) return options.load(call, state, image);
      if (source.startsWith('https://')) state.paths.set(source, `/cache/${state.loadCalls.length}.png`);
      return image(size.maxWidth, size.maxHeight);
    },
    prefetch() { assert.fail('원본 이미지를 decode하는 별도 prefetch를 호출하지 않는다'); },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(cachePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: cachePath,
  }).outputText;
  runInNewContext(source, {
    exports: module.exports,
    module,
    require(id) {
      assert.equal(id, 'expo-image', 'shared 캐시는 특정 도메인을 import하지 않는다');
      return { Image: ExpoImage };
    },
  }, { filename: cachePath });
  return { cache: module.exports, state, image };
}

test('디스크 miss는 요청 픽셀 크기로 URL을 직접 준비하고 메모리 참조를 재사용한다', async () => {
  const { cache, state } = createCache();
  const ref = await cache.prepareImage(URI, SIZE);
  assert.equal(state.cacheCalls.length, 1);
  assert.deepEqual(state.loadCalls, [{ source: URI, size: SIZE }]);
  assert.equal(cache.getPreparedImage(URI, SIZE), ref);
  assert.equal(await cache.prepareImage(URI, SIZE), ref);
  assert.equal(state.cacheCalls.length, 1);
  assert.equal(state.loadCalls.length, 1);
});

test('실제 디스크 hit는 절대 경로를 인코딩한 file URI로 decode한다', async () => {
  const { cache, state } = createCache({ paths: [[URI, '/cache/animal space#한글.png']] });
  await cache.prepareImage(URI, SIZE);
  assert.equal(state.loadCalls[0].source, 'file:///cache/animal%20space%23%ED%95%9C%EA%B8%80.png');
});

test('이미 URI인 캐시 경로는 다시 인코딩하지 않는다', async () => {
  const fileUri = 'file:///cache/animal%20space.png';
  const { cache, state } = createCache({ paths: [[URI, fileUri]] });
  await cache.prepareImage(URI, SIZE);
  assert.equal(state.loadCalls[0].source, fileUri);
});

test('같은 URL과 ceil로 정규화된 크기의 진행 Promise는 하나로 합친다', async () => {
  const gate = deferred();
  const { cache, state, image } = createCache({ load: () => gate.promise });
  const first = cache.prepareImage(URI, { maxWidth: 79.1, maxHeight: 72.1 });
  const second = cache.prepareImage(URI, { maxWidth: 79.9, maxHeight: 72.9 });
  assert.equal(first, second);
  await nextTurn();
  assert.deepEqual(state.loadCalls, [{ source: URI, size: SIZE }]);
  const ref = image();
  gate.resolve(ref);
  assert.equal(await first, ref);
  assert.equal(await second, ref);
  assert.equal(cache.getPreparedImage(URI, SIZE), ref);
});

test('같은 URL의 다른 크기는 앞선 준비를 기다린 뒤 디스크 캐시를 다시 확인한다', async () => {
  const gate = deferred();
  const larger = { maxWidth: 160, maxHeight: 146 };
  const { cache, state, image } = createCache({
    load(call, current, makeImage) {
      if (current.loadCalls.length === 1) {
        return gate.promise.then((ref) => {
          current.paths.set(URI, '/cache/original.png');
          return ref;
        });
      }
      return makeImage(call.size.maxWidth, call.size.maxHeight);
    },
  });
  const first = cache.prepareImage(URI, SIZE);
  const second = cache.prepareImage(URI, larger);
  assert.notEqual(first, second);
  await nextTurn();
  assert.equal(state.cacheCalls.length, 1);
  assert.equal(state.loadCalls.length, 1);
  gate.resolve(image());
  const [smallRef, largeRef] = await Promise.all([first, second]);
  assert.equal(state.cacheCalls.length, 2);
  assert.deepEqual(state.loadCalls[1], { source: 'file:///cache/original.png', size: larger });
  assert.notEqual(smallRef, largeRef);
  assert.equal(cache.getPreparedImage(URI, SIZE), smallRef);
  assert.equal(cache.getPreparedImage(URI, larger), largeRef);
});

test('첫 준비 뒤 디스크 경로가 아직 없으면 다음 크기도 URL과 제한 크기로 준비한다', async () => {
  const { cache, state } = createCache({ load: (call, _, image) => image(call.size.maxWidth, call.size.maxHeight) });
  await Promise.all([
    cache.prepareImage(URI, SIZE),
    cache.prepareImage(URI, { maxWidth: 160, maxHeight: 146 }),
  ]);
  assert.deepEqual(state.loadCalls.map((call) => call.source), [URI, URI]);
  assert.equal(state.cacheCalls.length, 2);
});

test('서로 다른 URL은 병렬로 준비하고 서명 query를 다른 cache key로 유지한다', async () => {
  const gate = deferred();
  const secondUri = URI.replace('first', 'second');
  const { cache, state, image } = createCache({ load: () => gate.promise });
  const first = cache.prepareImage(URI, SIZE);
  const second = cache.prepareImage(secondUri, SIZE);
  await nextTurn();
  assert.equal(state.loadCalls.length, 2);
  assert.deepEqual(state.loadCalls.map((call) => call.source), [URI, secondUri]);
  gate.resolve(image());
  await Promise.all([first, second]);
});

test('디스크 경로 조회 오류는 URL loadAsync로 복구한다', async () => {
  const { cache, state } = createCache({ getPath() { throw new Error('디스크 경로 조회 실패'); } });
  const ref = await cache.prepareImage(URI, SIZE);
  assert.ok(ref);
  assert.equal(state.loadCalls[0].source, URI);
});

test('네이티브 준비 실패는 원래 오류를 전달하고 이후 요청은 다시 시도한다', async () => {
  const failure = new Error('native decode 실패');
  const { cache, state } = createCache({
    load(call, current, image) {
      if (current.loadCalls.length === 1) throw failure;
      return image(call.size.maxWidth, call.size.maxHeight);
    },
  });
  await assert.rejects(cache.prepareImage(URI, SIZE), (error) => error === failure);
  assert.equal(cache.getPreparedImage(URI, SIZE), undefined);
  const ref = await cache.prepareImage(URI, SIZE);
  assert.equal(state.cacheCalls.length, 2);
  assert.equal(state.loadCalls.length, 2);
  assert.equal(cache.getPreparedImage(URI, SIZE), ref);
});

test('실패한 크기는 같은 URL에서 대기하던 다음 크기의 준비를 막지 않는다', async () => {
  const failure = new Error('작은 크기 준비 실패');
  const { cache, state } = createCache({
    load(call, current, image) {
      if (current.loadCalls.length === 1) throw failure;
      return image(call.size.maxWidth, call.size.maxHeight);
    },
  });
  const first = assert.rejects(cache.prepareImage(URI, SIZE), (error) => error === failure);
  const second = cache.prepareImage(URI, { maxWidth: 160, maxHeight: 146 });
  await first;
  assert.ok(await second);
  assert.equal(state.loadCalls.length, 2);
});

test('32개 참조 상한은 최근에 읽은 항목을 남기며 이전 화면의 참조를 release하지 않는다', async () => {
  const { cache, state } = createCache();
  const refs = [];
  for (let index = 0; index < 32; index += 1) {
    refs.push(await cache.prepareImage(`https://images.test/${index}`, SIZE));
  }
  assert.equal(cache.getPreparedImage('https://images.test/0', SIZE), refs[0]);
  await cache.prepareImage('https://images.test/32', SIZE);
  assert.equal(cache.getPreparedImage('https://images.test/1', SIZE), undefined);
  assert.equal(cache.getPreparedImage('https://images.test/0', SIZE), refs[0]);
  assert.equal(refs[1].width, SIZE.maxWidth);
  assert.equal(state.released.length, 0);
});

test('16MiB 추정 상한은 native 참조의 크기와 scale을 반영하고 LRU로 제거한다', async () => {
  const { cache, state } = createCache({ load: (_, __, image) => image(512, 512, 2) });
  const largeSize = { maxWidth: 1024, maxHeight: 1024 };
  const refs = [];
  for (let index = 0; index < 4; index += 1) {
    refs.push(await cache.prepareImage(`https://images.test/large-${index}`, largeSize));
  }
  assert.equal(cache.getPreparedImage('https://images.test/large-0', largeSize), refs[0]);
  await cache.prepareImage('https://images.test/large-4', largeSize);
  assert.equal(cache.getPreparedImage('https://images.test/large-1', largeSize), undefined);
  assert.equal(cache.getPreparedImage('https://images.test/large-0', largeSize), refs[0]);
  assert.equal(state.released.length, 0);
});

test('한 참조가 메모리 상한보다 크면 반환만 하고 기존 작은 캐시를 제거하지 않는다', async () => {
  const { cache, state } = createCache({
    load(_, current, image) { return current.loadCalls.length === 1 ? image() : image(3072, 2048); },
  });
  const small = await cache.prepareImage(URI, SIZE);
  const oversizedUri = 'https://images.test/oversized';
  const large = await cache.prepareImage(oversizedUri, { maxWidth: 3072, maxHeight: 2048 });
  assert.equal(large.width, 3072);
  assert.equal(cache.getPreparedImage(oversizedUri, { maxWidth: 3072, maxHeight: 2048 }), undefined);
  assert.equal(cache.getPreparedImage(URI, SIZE), small);
  assert.equal(state.released.length, 0);
});

test('LRU로 제거된 참조는 디스크를 다시 확인하며 재준비할 수 있다', async () => {
  const { cache, state } = createCache();
  const first = await cache.prepareImage(URI, SIZE);
  for (let index = 0; index < 32; index += 1) {
    await cache.prepareImage(`https://images.test/other-${index}`, SIZE);
  }
  assert.equal(cache.getPreparedImage(URI, SIZE), undefined);
  const second = await cache.prepareImage(URI, SIZE);
  assert.notEqual(first, second);
  assert.equal(state.loadCalls.at(-1).source, 'file:///cache/1.png');
});

test('reset은 세션을 올리고 캐시만 제거하며 화면이 보유한 native ref를 release하지 않는다', async () => {
  const { cache, state } = createCache();
  const ref = await cache.prepareImage(URI, SIZE);
  const session = cache.getPreparedImageCacheSession();
  cache.resetPreparedImageCache();
  assert.equal(cache.getPreparedImageCacheSession(), session + 1);
  assert.equal(cache.getPreparedImage(URI, SIZE), undefined);
  assert.equal(ref.width, SIZE.maxWidth);
  assert.equal(state.released.length, 0);
});

test('native 호출 전 reset된 준비는 전송하지 않고 새 세션의 같은 key 요청을 유지한다', async () => {
  const gate = deferred();
  const { cache, state, image } = createCache({ load: () => gate.promise });
  const old = assert.rejects(cache.prepareImage(URI, SIZE), /이미지 준비 상태가 변경/);
  cache.resetPreparedImageCache();
  const current = cache.prepareImage(URI, SIZE);
  await nextTurn();
  await old;
  assert.equal(state.loadCalls.length, 1);
  assert.equal(cache.prepareImage(URI, SIZE), current);
  gate.resolve(image());
  await current;
});

test('디스크 조회 중 reset되면 이전 결과는 decode하지 않고 새 캐시를 덮지 않는다', async () => {
  const gate = deferred();
  const { cache, state } = createCache({
    getPath(_, current) { return current.cacheCalls.length === 1 ? gate.promise : null; },
  });
  const old = assert.rejects(cache.prepareImage(URI, SIZE), /이미지 준비 상태가 변경/);
  await nextTurn();
  cache.resetPreparedImageCache();
  const latest = await cache.prepareImage(URI, SIZE);
  gate.resolve('/cache/old.png');
  await old;
  assert.equal(state.loadCalls.length, 1);
  assert.equal(cache.getPreparedImage(URI, SIZE), latest);
});

for (const outcome of ['성공', '실패']) {
  test(`decode 중 reset 뒤 이전 ${outcome} 결과는 새 요청과 캐시에 영향을 주지 않는다`, async () => {
    const oldGate = deferred();
    const newGate = deferred();
    const failure = new Error('이전 native 요청 실패');
    const { cache, state, image } = createCache({
      load(_, current) { return current.loadCalls.length === 1 ? oldGate.promise : newGate.promise; },
    });
    const oldPromise = cache.prepareImage(URI, SIZE);
    const old = assert.rejects(oldPromise, outcome === '성공'
      ? /이미지 준비 상태가 변경/
      : (error) => error === failure);
    await nextTurn();
    cache.resetPreparedImageCache();
    const current = cache.prepareImage(URI, SIZE);
    await nextTurn();
    assert.equal(state.loadCalls.length, 2);
    if (outcome === '성공') oldGate.resolve(image());
    else oldGate.reject(failure);
    await old;
    assert.equal(cache.prepareImage(URI, SIZE), current, '이전 finally가 새 진행 요청을 제거하지 않는다');
    const latest = image();
    newGate.resolve(latest);
    assert.equal(await current, latest);
    assert.equal(cache.getPreparedImage(URI, SIZE), latest);
    assert.equal(state.released.length, 0);
  });
}

test('reset 전 같은 URL에 대기하던 다른 크기도 이전 세션에서 새 decode를 시작하지 않는다', async () => {
  const gate = deferred();
  const { cache, state, image } = createCache({ load: () => gate.promise });
  const first = assert.rejects(cache.prepareImage(URI, SIZE), /이미지 준비 상태가 변경/);
  const second = assert.rejects(cache.prepareImage(URI, { maxWidth: 160, maxHeight: 146 }), /이미지 준비 상태가 변경/);
  await nextTurn();
  assert.equal(state.loadCalls.length, 1);
  cache.resetPreparedImageCache();
  gate.resolve(image());
  await Promise.all([first, second]);
  assert.equal(state.loadCalls.length, 1);
});

test('잘못된 픽셀 크기는 native 작업 없이 준비를 거부한다', async () => {
  const { cache, state } = createCache();
  for (const size of [
    { maxWidth: 0, maxHeight: 10 },
    { maxWidth: 10, maxHeight: -1 },
    { maxWidth: NaN, maxHeight: 10 },
    { maxWidth: 10, maxHeight: Infinity },
  ]) {
    await assert.rejects(cache.prepareImage(URI, size), /이미지 준비 크기/);
  }
  assert.equal(state.cacheCalls.length, 0);
  assert.equal(state.loadCalls.length, 0);
});
