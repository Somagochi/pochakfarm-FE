type SessionExpirationListener = () => void;

const sessionExpirationListeners = new Set<SessionExpirationListener>();

export function notifySessionExpired() {
  sessionExpirationListeners.forEach((listener) => listener());
}

export function subscribeToSessionExpiration(
  listener: SessionExpirationListener,
) {
  sessionExpirationListeners.add(listener);

  return () => {
    sessionExpirationListeners.delete(listener);
  };
}
