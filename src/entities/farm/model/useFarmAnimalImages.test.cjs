const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const hookPath = require.resolve('./useFarmAnimalImages.ts');
const manifestPath = require.resolve('../lib/farmAnimalImages.ts');
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const FIRST_URI = 'https://images.test/first.png';
const SECOND_URI = 'https://images.test/second.png';

// 외부 renderer 없이 실제 훅을 실행하고 render 이후 effect/cleanup을 적용합니다.
function createHookRunner() {
  const slots = [];
  let cursor = 0;
  let dirty = false;
  let props;
  let hook;
  let output;
  let renderCount = 0;
  let pendingEffects = [];
  const sameDeps = (first, second) => first && second &&
    first.length === second.length && first.every((value, index) => Object.is(value, second[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      const slot = slots[index];
      if (!slot.set) {
        slot.set = (update) => {
          const next = typeof update === 'function' ? update(slot.value) : update;
          if (!Object.is(next, slot.value)) { slot.value = next; dirty = true; }
        };
      }
      return [slot.value, slot.set];
    },
    useRef(value) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: value };
      return slots[index];
    },
    useMemo(create, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        slots[index] = { deps, value: create() };
      }
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !sameDeps(previous.deps, deps)) {
        const slot = { deps, cleanup: previous?.cleanup };
        slots[index] = slot;
        pendingEffects.push(() => {
          slot.cleanup?.();
          slot.cleanup = effect();
        });
      }
    },
  };
  const flush = () => {
    for (let renders = 0; dirty; renders += 1) {
      assert.ok(renders < 30, '훅이 상태 갱신을 무한 반복하지 않는다');
      dirty = false;
      cursor = 0;
      pendingEffects = [];
      renderCount += 1;
      output = hook(props);
      for (const effect of pendingEffects) effect();
    }
    return output;
  };
  return {
    react,
    setHook(value) { hook = value; },
    render(value) { props = value; dirty = true; return flush(); },
    snapshot: flush,
    renderCount: () => renderCount,
  };
}

function createHarness() {
  const runner = createHookRunner();
  const memory = new Map();
  const active = new Map();
  const requests = [];
  let session = 0;
  const keyFor = (uri, size) => JSON.stringify([uri, size.maxWidth, size.maxHeight]);
  const cache = {
    getPreparedImageCacheSession: () => session,
    getPreparedImage: (uri, size) => memory.get(keyFor(uri, size)),
    prepareImage(uri, size) {
      const key = keyFor(uri, size);
      if (memory.has(key)) return Promise.resolve(memory.get(key));
      if (active.has(key)) return active.get(key).promise;
      const epoch = session;
      let resolve;
      let reject;
      const promise = new Promise((complete, fail) => { resolve = complete; reject = fail; })
        .then((image) => {
          if (epoch === session) memory.set(key, image);
          return image;
        })
        .finally(() => { if (active.get(key)?.promise === promise) active.delete(key); });
      const request = { uri, size: { ...size }, session: epoch, promise, resolve, reject };
      active.set(key, request);
      requests.push(request);
      return promise;
    },
  };
  const modules = new Map();
  const loadModule = (filename) => {
    const module = { exports: {} };
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText;
    runInNewContext(source, {
      exports: module.exports,
      module,
      Map,
      Set,
      require(id) {
        if (id === 'react') return runner.react;
        if (id === 'react-native') {
          return { Dimensions: { get: () => ({ width: 360 }) }, PixelRatio: { get: () => 3 } };
        }
        if (id === '@/src/shared/lib/image/preparedImageCache') return cache;
        if (id === '../lib/farmAnimalImages') return modules.get(manifestPath);
        assert.fail(`예상하지 못한 import: ${id}`);
      },
    }, { filename });
    modules.set(filename, module.exports);
    return module.exports;
  };
  const manifest = loadModule(manifestPath);
  const hook = loadModule(hookPath);
  runner.setHook(hook.useFarmAnimalImages);
  return {
    ...runner,
    manifest,
    requests,
    image: (name) => ({ name, width: 288, height: 263, scale: 1 }),
    seed(uri, image, imageWidth = 80, imageHeight = 73) {
      memory.set(keyFor(uri, manifest.getFarmAnimalImageSize(imageWidth, imageHeight)), image);
    },
    reset() { session += 1; memory.clear(); active.clear(); },
  };
}

function slot(slotNum, uri = FIRST_URI, animalId = slotNum) {
  return {
    slotNum,
    animal: { animalId, animalName: `동물 ${animalId}`, animalImageUrl: uri, cardImageUrl: null },
  };
}

function options(slots = [slot(1), slot(2, SECOND_URI)], overrides = {}) {
  return {
    type: 'SPACE',
    floors: [{ floorNum: 1, unlocked: true, slots }],
    imageWidth: 80,
    imageHeight: 73,
    ...overrides,
  };
}

function keys(harness, props) {
  return Array.from(harness.manifest.getFarmAnimalImages(props.floors), (image) => image.key);
}

test('전체 이미지 준비와 각 동물 표시가 모두 끝나야 농장을 공개한다', async () => {
  const harness = createHarness();
  const props = options();
  const [firstKey, secondKey] = keys(harness, props);
  const firstImage = harness.image('첫 동물');
  const secondImage = harness.image('둘째 동물');
  assert.equal(harness.render(props).isPrepared, false);
  assert.equal(harness.snapshot().isReady, false);
  assert.equal(harness.requests.length, 2);

  harness.snapshot().markDisplayed(firstKey);
  harness.requests[0].resolve(firstImage);
  await nextTurn();
  assert.equal(harness.snapshot().isPrepared, false);
  assert.equal(harness.snapshot().images.size, 0);
  harness.requests[1].resolve(secondImage);
  await nextTurn();
  const prepared = harness.snapshot();
  assert.equal(prepared.isPrepared, true);
  assert.equal(prepared.isReady, false);
  assert.equal(prepared.images.get(firstKey), firstImage);
  assert.equal(prepared.images.get(secondKey), secondImage);
  prepared.markDisplayed(firstKey);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('전부 메모리 캐시에 있어도 네이티브 표시 완료를 각각 기다린다', () => {
  const harness = createHarness();
  const props = options();
  const [firstKey, secondKey] = keys(harness, props);
  const firstImage = harness.image('캐시 첫 동물');
  const secondImage = harness.image('캐시 둘째 동물');
  harness.seed(FIRST_URI, firstImage);
  harness.seed(SECOND_URI, secondImage);
  const initial = harness.render(props);
  assert.equal(initial.isPrepared, true);
  assert.equal(initial.isReady, false);
  assert.equal(initial.images.get(firstKey), firstImage);
  assert.equal(initial.images.get(secondKey), secondImage);
  assert.equal(harness.requests.length, 0);
  initial.markDisplayed(firstKey);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('동물별 표시 완료는 농장을 다시 렌더링하지 않고 마지막 완료에서 한 번만 갱신한다', () => {
  const harness = createHarness();
  const slots = Array.from({ length: 4 }, (_, index) => slot(index + 1, `https://images.test/${index}.png`));
  const props = options(slots);
  for (const item of slots) harness.seed(item.animal.animalImageUrl, harness.image(item.animal.animalName));
  const pending = harness.render(props);
  const initialRenders = harness.renderCount();
  const imageKeys = keys(harness, props);
  for (const key of imageKeys.slice(0, -1)) {
    pending.markDisplayed(key);
    assert.equal(harness.snapshot().isReady, false);
    assert.equal(harness.renderCount(), initialRenders);
  }
  pending.markDisplayed(imageKeys.at(-1));
  assert.equal(harness.snapshot().isReady, true);
  assert.equal(harness.renderCount(), initialRenders + 1);
});

test('일부 캐시 동물의 표시가 먼저 끝나도 나머지 준비 및 표시를 기다린다', async () => {
  const harness = createHarness();
  const props = options();
  const [firstKey, secondKey] = keys(harness, props);
  harness.seed(FIRST_URI, harness.image('캐시 동물'));
  const initial = harness.render(props);
  initial.markDisplayed(firstKey);
  assert.equal(harness.snapshot().isPrepared, false);
  assert.equal(harness.snapshot().isReady, false);
  assert.equal(harness.requests.length, 1);
  harness.requests[0].resolve(harness.image('나머지 동물'));
  await nextTurn();
  assert.equal(harness.snapshot().isPrepared, true);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('잠긴 층과 빈 슬롯은 제외하고 URL 없는 동물은 기본 이미지 표시를 기다린다', () => {
  const harness = createHarness();
  const props = options([], {
    floors: [
      { floorNum: 1, unlocked: true, slots: [slot(1, null), slot(2, ''), { slotNum: 3, animal: null }] },
      { floorNum: 2, unlocked: false, slots: [slot(1, FIRST_URI)] },
    ],
  });
  const imageKeys = keys(harness, props);
  assert.equal(imageKeys.length, 2);
  assert.notEqual(imageKeys[0], imageKeys[1]);
  const initial = harness.render(props);
  assert.equal(initial.images.size, 2);
  assert.ok(Array.from(initial.images.values()).every((image) => image === null));
  assert.equal(initial.isPrepared, true);
  assert.equal(initial.isReady, false);
  assert.equal(harness.requests.length, 0);
  initial.markDisplayed(imageKeys[0]);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(imageKeys[1]);
  assert.equal(harness.snapshot().isReady, true);
});

test('표시할 동물이 없는 농장은 별도 이미지 요청 없이 준비된다', () => {
  const harness = createHarness();
  const result = harness.render(options([]));
  assert.equal(result.images.size, 0);
  assert.equal(result.isPrepared, true);
  assert.equal(result.isReady, true);
  assert.equal(harness.requests.length, 0);
});

test('하나의 준비 실패는 기본 이미지로 바꾸고 모든 동물 표시 뒤 함께 공개한다', async () => {
  const harness = createHarness();
  const props = options();
  const [firstKey, secondKey] = keys(harness, props);
  harness.render(props);
  harness.requests[0].reject(new Error('이미지 다운로드 실패'));
  await nextTurn();
  assert.equal(harness.snapshot().isPrepared, false);
  harness.requests[1].resolve(harness.image('정상 동물'));
  await nextTurn();
  const result = harness.snapshot();
  assert.equal(result.isPrepared, true);
  assert.equal(result.images.get(firstKey), null);
  assert.ok(result.images.get(secondKey));
  assert.equal(result.isReady, false);
  result.markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(firstKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('준비된 참조 표시 오류는 완료 기록을 지우고 기본 이미지가 표시될 때까지 기다린다', () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  const [key] = keys(harness, props);
  harness.seed(FIRST_URI, harness.image('원래 동물'));
  const result = harness.render(props);
  result.markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  harness.snapshot().markFailed(key);
  assert.equal(harness.snapshot().images.get(key), null);
  assert.equal(harness.snapshot().isPrepared, true);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
});

test('일괄 준비가 뒤늦게 완료돼도 이미 표시 실패한 동물의 기본 이미지를 덮지 않는다', async () => {
  const harness = createHarness();
  const props = options();
  const [firstKey, secondKey] = keys(harness, props);
  harness.seed(FIRST_URI, harness.image('표시 실패할 캐시 동물'));
  const result = harness.render(props);
  result.markFailed(firstKey);
  harness.snapshot().markDisplayed(firstKey);
  assert.equal(harness.snapshot().isReady, false);
  harness.requests[0].resolve(harness.image('나머지 동물'));
  await nextTurn();
  assert.equal(harness.snapshot().images.get(firstKey), null);
  assert.equal(harness.snapshot().isPrepared, true);
  harness.snapshot().markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('환경·URL·슬롯·물리 크기가 바뀌면 이전 표시 및 오류 콜백을 무시한다', async (t) => {
  const changes = {
    환경: (props) => ({ ...props, type: 'GROUND' }),
    URL: (props) => options([slot(1, SECOND_URI)], { type: props.type }),
    슬롯: (props) => options([slot(2, FIRST_URI, 1)], { type: props.type }),
    크기: (props) => ({ ...props, imageWidth: 100, imageHeight: 90 }),
  };
  for (const [name, change] of Object.entries(changes)) {
    await t.test(name, () => {
      const harness = createHarness();
      const props = options([slot(1)]);
      const nextProps = change(props);
      const firstImage = harness.image('기존 크기 동물');
      const resizedImage = harness.image('다음 크기 동물');
      harness.seed(FIRST_URI, firstImage);
      harness.seed(SECOND_URI, firstImage);
      harness.seed(FIRST_URI, resizedImage, 100, 90);
      const previous = harness.render(props);
      const [previousKey] = keys(harness, props);
      previous.markDisplayed(previousKey);
      assert.equal(harness.snapshot().isReady, true);
      const next = harness.render(nextProps);
      const [nextKey] = keys(harness, nextProps);
      const nextImage = next.images.get(nextKey);
      assert.notEqual(next.batchKey, previous.batchKey);
      assert.equal(next.isReady, false);
      previous.markDisplayed(previousKey);
      previous.markFailed(previousKey);
      assert.equal(harness.snapshot().isReady, false);
      assert.equal(harness.snapshot().images.get(nextKey), nextImage);
      harness.snapshot().markDisplayed(nextKey);
      assert.equal(harness.snapshot().isReady, true);
      assert.equal(harness.requests.length, 0);
    });
  }
});

test('API가 같은 manifest의 새 농장 객체를 반환하면 이미 끝난 준비 및 표시를 유지한다', () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  const [key] = keys(harness, props);
  const ref = harness.image('재사용 동물');
  harness.seed(FIRST_URI, ref);
  harness.render(props).markDisplayed(key);
  const ready = harness.snapshot();
  const nextProps = JSON.parse(JSON.stringify(props));
  nextProps.floors[0].slots[0].animal.animalName = '서버에서 바뀐 이름';
  const next = harness.render(nextProps);
  assert.notEqual(nextProps.floors, props.floors);
  assert.equal(next.batchKey, ready.batchKey);
  assert.equal(next.images, ready.images);
  assert.equal(next.images.get(key), ref);
  assert.equal(next.isPrepared, true);
  assert.equal(next.isReady, true);
  assert.equal(harness.requests.length, 0);
});

test('땅에서 우주로 갔다가 땅으로 돌아와도 첫 땅의 늦은 표시 및 오류 콜백은 무시한다', () => {
  const harness = createHarness();
  const props = options([slot(1)], { type: 'GROUND' });
  const [key] = keys(harness, props);
  const image = harness.image('두 환경의 동일 URL 동물');
  harness.seed(FIRST_URI, image);
  const firstGround = harness.render(props);
  firstGround.markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  harness.render({ ...props, type: 'SPACE' }).markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  const nextGround = harness.render(props);
  assert.equal(nextGround.isPrepared, true);
  assert.equal(nextGround.isReady, false);
  firstGround.markDisplayed(key);
  assert.equal(harness.snapshot().isReady, false);
  firstGround.markFailed(key);
  assert.equal(harness.snapshot().images.get(key), image);
  harness.snapshot().markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  assert.equal(harness.requests.length, 0);
});

test('중간 환경 표시가 끝나기 전에 복귀해도 예전 농장의 완료 상태를 재사용하지 않는다', () => {
  const harness = createHarness();
  const props = options([slot(1)], { type: 'GROUND' });
  const [key] = keys(harness, props);
  const image = harness.image('메모리에서 재사용하는 이미지');
  harness.seed(FIRST_URI, image);
  harness.render(props).markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  const space = harness.render({ ...props, type: 'SPACE' });
  assert.equal(space.isPrepared, true);
  assert.equal(space.isReady, false);
  const returned = harness.render(props);
  assert.equal(returned.images.get(key), image);
  assert.equal(returned.isPrepared, true);
  assert.equal(returned.isReady, false);
  returned.markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  assert.equal(harness.requests.length, 0);
});

test('reset 직후 rerender 전에도 이전 세션의 표시 및 오류 콜백을 차단한다', () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  const [key] = keys(harness, props);
  const image = harness.image('이전 세션 참조');
  harness.seed(FIRST_URI, image);
  const previous = harness.render(props);
  harness.reset();
  previous.markDisplayed(key);
  previous.markFailed(key);
  assert.equal(harness.snapshot().isReady, false);
  assert.equal(harness.snapshot().images.get(key), image);
});

test('reset 직후 rerender가 없어도 이전 세션의 준비 완료를 반영하지 않는다', async () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  harness.render(props);
  harness.reset();
  harness.requests[0].resolve(harness.image('반영되면 안 되는 이전 이미지'));
  await nextTurn();
  assert.equal(harness.snapshot().isPrepared, false);
  assert.equal(harness.snapshot().isReady, false);
  assert.equal(harness.snapshot().images.size, 0);
});

test('이미지 세션 reset 뒤 이전 준비 완료와 표시 콜백은 새 농장을 준비시키지 못한다', async () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  const [key] = keys(harness, props);
  const previous = harness.render(props);
  const oldRequest = harness.requests[0];
  harness.reset();
  const next = harness.render(props);
  assert.notEqual(next.batchKey, previous.batchKey);
  assert.equal(harness.requests.length, 2);
  oldRequest.resolve(harness.image('이전 계정 동물'));
  await nextTurn();
  previous.markDisplayed(key);
  previous.markFailed(key);
  assert.equal(harness.snapshot().isPrepared, false);
  assert.equal(harness.snapshot().images.size, 0);
  const freshImage = harness.image('새 계정 동물');
  harness.requests[1].resolve(freshImage);
  await nextTurn();
  assert.equal(harness.snapshot().images.get(key), freshImage);
  assert.equal(harness.snapshot().isPrepared, true);
  assert.equal(harness.snapshot().isReady, false);
  previous.markDisplayed(key);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
});

test('이전 manifest의 늦은 비동기 완료가 새 이미지 배치 및 표시 완료를 덮지 않는다', async () => {
  const harness = createHarness();
  const previousProps = options([slot(1)]);
  const nextProps = options([slot(1, SECOND_URI)]);
  harness.render(previousProps);
  const current = harness.render(nextProps);
  const [key] = keys(harness, nextProps);
  const freshImage = harness.image('최신 URL 동물');
  harness.requests[1].resolve(freshImage);
  await nextTurn();
  harness.snapshot().markDisplayed(key);
  assert.equal(harness.snapshot().isReady, true);
  harness.requests[0].resolve(harness.image('오래된 URL 동물'));
  await nextTurn();
  assert.equal(harness.snapshot().batchKey, current.batchKey);
  assert.equal(harness.snapshot().images.size, 1);
  assert.equal(harness.snapshot().images.get(key), freshImage);
  assert.equal(harness.snapshot().isReady, true);
});

test('같은 URL을 쓰는 다른 슬롯은 이미지 참조를 공유해도 표시 완료를 따로 기다린다', async () => {
  const harness = createHarness();
  const props = options([slot(1, FIRST_URI, 1), slot(2, FIRST_URI, 1)]);
  const [firstKey, secondKey] = keys(harness, props);
  assert.notEqual(firstKey, secondKey);
  harness.render(props);
  assert.equal(harness.requests.length, 1);
  const image = harness.image('공유 URL 동물');
  harness.requests[0].resolve(image);
  await nextTurn();
  const result = harness.snapshot();
  assert.equal(result.images.size, 2);
  assert.equal(result.images.get(firstKey), image);
  assert.equal(result.images.get(secondKey), image);
  result.markDisplayed(firstKey);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(secondKey);
  assert.equal(harness.snapshot().isReady, true);
});

test('존재하지 않는 표시 및 오류 콜백과 중복 표시 콜백은 준비 상태를 바꾸지 않는다', () => {
  const harness = createHarness();
  const props = options([slot(1)]);
  const [key] = keys(harness, props);
  harness.seed(FIRST_URI, harness.image('정상 동물'));
  const initial = harness.render(props);
  initial.markDisplayed('없는 슬롯');
  initial.markFailed('없는 슬롯');
  assert.equal(harness.snapshot().images, initial.images);
  assert.equal(harness.snapshot().isReady, false);
  harness.snapshot().markDisplayed(key);
  const ready = harness.snapshot();
  ready.markDisplayed(key);
  assert.equal(harness.snapshot().images, ready.images);
  assert.equal(harness.snapshot().isReady, true);
});

test('이미지 준비 크기는 화면 크기와 밀도 및 드래그 확대를 반영해 정수 픽셀로 계산한다', () => {
  const { manifest } = createHarness();
  const defaults = manifest.getFarmAnimalImageSize();
  assert.equal(defaults.maxWidth, 288);
  assert.equal(defaults.maxHeight, 263);
  const explicit = manifest.getFarmAnimalImageSize(80.5, 73.5);
  assert.equal(explicit.maxWidth, 290);
  assert.equal(explicit.maxHeight, 265);
  const zero = manifest.getFarmAnimalImageSize(0, 0);
  assert.equal(zero.maxWidth, 1);
  assert.equal(zero.maxHeight, 1);
});
