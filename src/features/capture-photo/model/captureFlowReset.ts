const resetListeners = new Set<() => void>();

export function requestCaptureFlowReset() {
  resetListeners.forEach((listener) => listener());
}

export function subscribeCaptureFlowReset(listener: () => void) {
  resetListeners.add(listener);

  return () => {
    resetListeners.delete(listener);
  };
}
