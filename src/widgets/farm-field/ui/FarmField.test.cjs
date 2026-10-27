const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const sourcePath = require.resolve('./FarmField.tsx');

function createHarness() {
  const hooks = [];
  const effects = [];
  const animations = [];
  const notifications = [];
  let cursor = 0;
  let dirty = false;
  let tree;
  let props;
  const same = (first, second) => first && second && first.length === second.length &&
    first.every((value, index) => Object.is(value, second[index]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ??= { current: initial };
    },
    useState(initial) {
      const index = cursor++;
      const state = hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      state.set ??= (update) => {
        const next = typeof update === 'function' ? update(state.value) : update;
        if (!Object.is(state.value, next)) { state.value = next; dirty = true; }
      };
      return [state.value, state.set];
    },
    useMemo(create, deps) {
      const index = cursor++;
      if (!hooks[index] || !same(hooks[index].deps, deps)) hooks[index] = { deps, value: create() };
      return hooks[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = hooks[index];
      if (previous && same(previous.deps, deps)) return;
      hooks[index] = { deps, cleanup: previous?.cleanup };
      effects.push(() => {
        hooks[index].cleanup?.();
        hooks[index].cleanup = effect();
      });
    },
  };
  const Image = Object.assign(function Image() {}, {
    resolveAssetSource: () => ({ width: 1490, height: 2983 }),
  });
  const jsx = (type, nodeProps) => ({ type, props: nodeProps });
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: sourcePath,
  }).outputText;
  runInNewContext(source, {
    module, exports: module.exports,
    require(id) {
      if (id.endsWith('.png')) return id;
      if (id === 'react') return react;
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (id === 'expo-router') return { router: { push() {} } };
      if (id === 'expo-image') return { Image: 'ExpoImage' };
      if (id === 'react-native-gesture-handler') return { GestureDetector: 'GestureDetector' };
      if (id === 'react-native-reanimated') return { __esModule: true, default: { View: 'DragView' } };
      if (id === 'react-native') return {
        Image, View: 'View', Platform: { OS: 'android' }, StyleSheet: { create: (styles) => styles },
        Animated: {
          Image: 'AnimatedImage',
          Value: class { constructor(value) { this.value = value; } setValue(value) { this.value = value; } },
          timing(value, options) {
            const animation = {
              options,
              start(callback) { animation.complete = callback; },
              stop() { animation.complete?.({ finished: false }); },
            };
            animations.push(animation);
            return animation;
          },
        },
      };
      if (id === '@/src/features/move-farm-creature') return {
        useFarmCreatureDrag: () => ({ canvasRef: {}, draggedSlot: null, dragStyle: {}, gesture: {} }),
      };
      if (id === '@/src/features/unlock-farm-area') return {
        FarmAreaRow: 'FarmAreaRow', FarmExpansionModal: 'FarmExpansionModal',
        useExpandFarmFloor: () => ({ expandFloor: async () => false, isExpanding: false }),
      };
      if (id === '@/src/entities/farm') return {
        getFarmAnimalImageKey() {},
        useFarmAnimalImages: () => ({
          batchKey: 'images', images: new Map(), isReady: true, markDisplayed() {}, markFailed() {},
        }),
      };
      if (id === '@/src/shared/ui/ErrorModal') return { ErrorModal: 'ErrorModal' };
      if (id === './FarmAmbientEffects') return { FarmAmbientEffects: 'FarmAmbientEffects' };
      if (id === './SkyFarmCloudLayer') return { SkyFarmCloudLayer: 'SkyFarmCloudLayer' };
      assert.fail(`예상하지 못한 import: ${id}`);
    },
  }, { filename: sourcePath });
  const flush = () => {
    let renders = 0;
    while (dirty) {
      assert.ok(++renders < 20);
      cursor = 0;
      dirty = false;
      tree = module.exports.FarmField(props);
      for (const effect of effects.splice(0)) effect();
    }
    return tree;
  };
  const nodes = (type) => {
    flush();
    const result = [];
    const visit = (node) => {
      if (!node) return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (typeof node !== 'object') return;
      if (node.type === type) result.push(node.props);
      visit(node.props?.children);
    };
    visit(tree);
    return result;
  };
  return {
    animations, notifications,
    render(environment = 'land', isTransitionCovered = false) {
      props = {
        environment, isTransitionCovered, farmType: environment === 'land' ? 'GROUND' : 'SPACE',
        floors: [], width: 360, onBackgroundReady: () => notifications.push(environment),
      };
      dirty = true;
      return flush();
    },
    displayed: () => nodes(Image)[0],
    incoming: () => nodes('AnimatedImage')[0],
    error: () => nodes('ErrorModal')[0].message,
  };
}

test('첫 농장 배경은 로드되기 전 준비 완료로 알리지 않는다', () => {
  const harness = createHarness();
  harness.render();
  assert.deepEqual(harness.notifications, []);
  harness.displayed().onLoad();
  assert.deepEqual(harness.notifications, ['land']);
  assert.equal(harness.animations.length, 0);
});

test('로딩 화면에 가려진 전환은 이미지 로드 직후 준비되고 페이드 대기를 만들지 않는다', () => {
  const harness = createHarness();
  harness.render();
  harness.render('space', true);
  const incoming = harness.incoming();
  assert.deepEqual(harness.notifications, []);
  incoming.onLoad();
  assert.deepEqual(harness.notifications, ['space']);
  assert.equal(harness.animations.length, 0);
  assert.equal(harness.displayed().source, incoming.source);
  assert.equal(harness.incoming(), undefined);
});

test('가려지지 않은 전환은 기존 페이드가 끝난 뒤 준비 완료로 알린다', () => {
  const harness = createHarness();
  harness.render();
  harness.render('space');
  harness.incoming().onLoad();
  assert.equal(harness.animations.length, 1);
  assert.equal(harness.animations[0].options.duration, 220);
  assert.deepEqual(harness.notifications, []);
  harness.animations[0].complete({ finished: true });
  assert.deepEqual(harness.notifications, ['space']);
  assert.equal(harness.incoming(), undefined);
});

test('이전 배경의 늦은 로드와 오류 콜백은 새 환경을 준비 완료로 만들지 않는다', () => {
  const harness = createHarness();
  harness.render();
  const oldBackground = harness.displayed();
  harness.render('space', true);
  oldBackground.onLoad();
  oldBackground.onError();
  assert.deepEqual(harness.notifications, []);
  assert.equal(harness.error(), null);
  harness.incoming().onLoad();
  assert.deepEqual(harness.notifications, ['space']);
});

test('환경을 다시 바꾼 뒤 이전 페이드가 완료돼도 새 배경을 덮지 않는다', () => {
  const harness = createHarness();
  harness.render();
  harness.displayed().onLoad();
  harness.notifications.length = 0;
  harness.render('space');
  harness.incoming().onLoad();
  const oldAnimation = harness.animations[0];
  harness.render('land', true);
  oldAnimation.complete({ finished: true });
  assert.deepEqual(harness.notifications, ['land']);
  assert.match(harness.displayed().source, /farm-background/);
  assert.equal(harness.incoming(), undefined);
});

test('배경 오류는 무한 로딩 대신 오류 안내와 화면 재진입을 허용한다', () => {
  const harness = createHarness();
  harness.render();
  harness.displayed().onError();
  assert.match(harness.error(), /농장 배경을 불러오지 못했습니다/);
  assert.deepEqual(harness.notifications, ['land']);
});
