const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

// 훅 슬롯과 커밋 시점을 재현해 콜백 교체 시 참조·최신 값 동작을 검증합니다.
function createHarness() {
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  const changed = (previous, next) => !previous || next.some((value, i) => !Object.is(value, previous[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useLayoutEffect(effect, deps) {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) {
        pendingEffects.push(() => {
          effect();
          slots[index] = { deps };
        });
      }
    },
  };
  const path = require.resolve('./useCaptureGameResultCallback.ts');
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    module,
    exports: module.exports,
    require(id) { assert.equal(id, 'react'); return react; },
  }, { filename: path });
  return {
    render(callback, commit = true) {
      cursor = 0;
      pendingEffects = [];
      const handler = module.exports.useCaptureGameResultCallback(callback);
      if (commit) pendingEffects.forEach((effect) => effect());
      return handler;
    },
  };
}

test('부모가 매번 새 콜백을 전달해도 참조를 유지하고 최신 콜백으로 결과를 전달한다', () => {
  const h = createHarness();
  const received = [];
  const initial = h.render((throws) => received.push({ render: 0, throws }));
  for (let i = 1; i <= 20; i++) {
    assert.equal(h.render((throws) => received.push({ render: i, throws })), initial);
  }
  const throws = [{ round: 1, succeeded: false }, { round: 2, succeeded: true }];
  initial(throws);
  assert.deepEqual(received, [{ render: 20, throws }]);
});

test('커밋되지 않은 렌더의 결과 핸들러는 실행하지 않는다', () => {
  const h = createHarness();
  const received = [];
  const handler = h.render(() => received.push('committed'));
  h.render(() => received.push('abandoned'), false);
  handler([]);
  assert.deepEqual(received, ['committed']);
});
