const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

function load(path, imports, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(require.resolve(path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    module, exports: module.exports, performance: { now: () => 100 }, ...globals,
    require(id) { assert.ok(id in imports, `Unexpected import: ${id}`); return imports[id]; },
  });
  return module.exports;
}

const math = load('../lib/calculateCaptureThrow.ts', {});
const geometry = { screenWidth: 360, frameCenterY: 600, targetCenterY: 300, minimumDistance: 24, idealDistance: 100, horizontalVelocityDistance: 80 };

test('위쪽 플릭 거리·속도 경계와 기존 투척 계산식을 유지한다', () => {
  assert.equal(math.calculateCaptureThrow(0, -24, 0, -0.18, geometry).valid, true);
  assert.equal(math.calculateCaptureThrow(0, -23.99, 0, -1, geometry).valid, false);
  assert.equal(math.calculateCaptureThrow(0, -100, 0, -0.1799, geometry).valid, false);
  const flight = math.calculateCaptureThrow(0, -100, 0, -1, geometry);
  assert.equal(flight.destinationY, -300);
  assert.equal(flight.landingDistance, 0);
  assert.equal(flight.durationMs, 520);
  assert.equal(math.calculateCaptureThrow(1000, -100, 10, -1, geometry).destinationX, 151.2);
});

test('성공 판정의 위치·타이밍 임계값은 모두 경계를 포함한다', () => {
  assert.equal(math.judgeCaptureLanding(0.38, 115, 115).succeeded, true);
  assert.equal(math.judgeCaptureLanding(0.38001, 115, 115).succeeded, false);
  assert.equal(math.judgeCaptureLanding(0.38, 115.00001, 115).succeeded, false);
  assert.equal(math.judgeCaptureLanding(0, 0, 115).succeeded, true);
});

// UI 애니메이션 완료와 JS 전달을 따로 실행해 JS 지연 중에도 판정이 확정되는지 검증합니다.
function createHarness({ initialRound = 0 } = {}) {
  const values = [];
  const styles = [];
  const effects = [];
  const jsQueue = [];
  const received = [];
  let handlers;
  const descriptor = (kind, target, callback, config) => ({ animation: true, kind, target, callback, config });
  const easing = (x) => x;
  const animated = {
    useSharedValue(initial) {
      let current = initial;
      const shared = {
        animation: null,
        get value() { return current; },
        set value(next) {
          if (next?.animation) shared.animation = next;
          else { current = next; shared.animation = null; }
        },
        modify(fn) { current = fn(current); },
      };
      values.push(shared);
      return shared;
    },
    useAnimatedStyle(fn) { styles.push(fn); return fn; },
    cancelAnimation(shared) { shared.animation = null; },
    runOnUI(fn) { return fn; },
    runOnJS(fn) { return (...args) => jsQueue.push(() => fn(...args)); },
    withTiming(target, config, callback) { return descriptor('timing', target, callback, config); },
    withSpring(target, config) { return descriptor('spring', target, undefined, config); },
    withSequence(...args) { return descriptor('sequence', args); },
    withDelay(delay, target) { return descriptor('delay', target, undefined, { delay }); },
    withRepeat(target) { return descriptor('repeat', target); },
    interpolateColor() { return '#628D38'; },
    Easing: { linear: easing, sin: easing, inOut: (fn) => fn },
    ReduceMotion: { Never: 'never' },
  };
  const gesture = {
    minDistance() { return this; }, maxPointers() { return this; },
    onUpdate(fn) { handlers.update = fn; return this; },
    onEnd(fn) { handlers.end = fn; return this; },
    onFinalize(fn) { handlers.finalize = fn; return this; },
  };
  const hook = load('./useCaptureGameAnimation.ts', {
    react: { useCallback: (fn) => fn, useEffect: (fn) => effects.push(fn), useRef: (value) => ({ current: value }) },
    'react-native-gesture-handler': { Gesture: { Pan() { handlers = {}; return gesture; } } },
    'react-native-reanimated': animated,
    '../lib/calculateCaptureThrow': math,
  });
  const result = hook.useCaptureGameAnimation({
    geometry, ringDurationMs: 2400, successDistance: 115, arcHeight: -42,
    dragLimitX: 14, dragLimitUp: 16, dragLimitDown: 8, throwsUsed: initialRound, ended: false,
    onThrowStart: () => received.push('start'),
    onReady: () => received.push('ready'),
    onLanding: (value) => received.push(value),
  });
  const cleanups = effects.map((fn) => fn()).filter(Boolean);
  const [ring, phase, , , dragX, , opacity, progress] = values;
  return {
    result, ring, phase, dragX, opacity, progress, received,
    release(overrides = {}) { handlers.end({ translationX: 0, translationY: -100, velocityX: 0, velocityY: -1000, ...overrides }); },
    complete(shared) {
      assert.ok(shared.animation);
      const animation = shared.animation;
      shared.value = animation.target;
      animation.callback?.(true);
    },
    flushJS() { while (jsQueue.length) jsQueue.shift()(); },
    unmount() { cleanups.forEach((fn) => fn()); },
    card: () => styles[2](),
  };
}

test('JS 전달이 늦어져도 도착 시 UI 링 값으로 판정을 확정하고 중복 입력을 막는다', () => {
  const h = createHarness();
  h.ring.value = 0.9;
  h.release();
  h.release();
  assert.equal(h.phase.value, 'flying');
  assert.equal(h.result.isThrowInProgress(), true);
  assert.equal(h.received.length, 0);
  h.ring.value = 0.38;
  h.complete(h.progress);
  assert.equal(h.phase.value, 'waiting');
  h.ring.value = 0.8;
  h.flushJS();
  assert.equal(h.received.length, 2);
  assert.equal(h.received[1].succeeded, true);
  assert.equal(h.received[1].round, 1);
  assert.equal(h.card().transform[1].translateY, -300);
});

test('위치 실패 후 UI에서 재등장과 링 재시작을 완료한다', () => {
  const h = createHarness();
  h.release({ translationX: 1000, velocityX: 10000 });
  h.complete(h.progress);
  h.complete(h.opacity);
  h.complete(h.opacity);
  assert.equal(h.phase.value, 'idle');
  assert.equal(h.ring.animation.kind, 'repeat');
  h.flushJS();
  assert.equal(h.received[1].isPositionMatched, false);
  assert.equal(h.received.at(-1), 'ready');
});

test('타이밍 실패는 숨긴 뒤 Lottie 종료 요청까지 다음 입력을 잠근다', () => {
  const h = createHarness();
  h.release();
  h.ring.value = 0.5;
  h.complete(h.progress);
  assert.equal(h.opacity.value, 0);
  assert.equal(h.phase.value, 'waiting');
  h.result.respawn(false);
  h.complete(h.opacity);
  assert.equal(h.phase.value, 'idle');
});

test('세 번째 위치 실패에서 자동 재등장하지 않는다', () => {
  const h = createHarness({ initialRound: 2 });
  h.release({ translationX: 1000 });
  h.complete(h.progress);
  assert.equal(h.opacity.animation, null);
  h.flushJS();
  assert.equal(h.received[1].round, 3);
});

test('화면 종료로 취소된 비행은 판정·결과 콜백을 전달하지 않는다', () => {
  const h = createHarness();
  h.release();
  const completion = h.progress.animation.callback;
  h.unmount();
  completion(true);
  h.flushJS();
  assert.equal(h.received.filter((value) => typeof value === 'object').length, 0);
  assert.equal(h.ring.animation, null);
});

test('판정 후 JS 큐에 대기 중이더라도 화면이 닫히면 결과를 전달하지 않는다', () => {
  const h = createHarness();
  h.release();
  h.ring.value = 0.2;
  h.complete(h.progress);
  h.unmount();
  h.flushJS();
  assert.equal(h.received.length, 0);
});
