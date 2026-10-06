import { usePathname } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';

import { useActiveApiRequestCount } from '@/src/shared/api/requestActivity';
import { LoadingScreen } from '@/src/shared/ui/LoadingScreen';

const INITIAL_REQUEST_WAIT_MS = 120;
const DEFAULT_LOCALLY_MANAGED_PATHS: readonly string[] = [];

type ScreenLoadingOverlayProps = {
  locallyManagedPaths?: readonly string[];
};

export function ScreenLoadingOverlay({
  locallyManagedPaths = DEFAULT_LOCALLY_MANAGED_PATHS,
}: ScreenLoadingOverlayProps) {
  const pathname = usePathname();
  const isLocallyManaged = locallyManagedPaths.includes(pathname);
  const activeRequestCount = useActiveApiRequestCount();
  const previousPathnameRef = useRef(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useLayoutEffect(() => {
    if (isLocallyManaged) {
      previousPathnameRef.current = pathname;
      setIsTransitioning(false);
      return;
    }

    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    setIsTransitioning(true);
  }, [isLocallyManaged, pathname]);

  useEffect(() => {
    if (isLocallyManaged || !isTransitioning || activeRequestCount > 0) return;

    let frameId: number | undefined;
    let interactionTask: ReturnType<
      typeof InteractionManager.runAfterInteractions
    > | undefined;
    const waitTimer = setTimeout(() => {
      interactionTask = InteractionManager.runAfterInteractions(() => {
        frameId = requestAnimationFrame(() => setIsTransitioning(false));
      });
    }, INITIAL_REQUEST_WAIT_MS);

    return () => {
      clearTimeout(waitTimer);
      interactionTask?.cancel();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
    };
  }, [activeRequestCount, isLocallyManaged, isTransitioning, pathname]);

  if (isLocallyManaged || !isTransitioning) return null;

  return <LoadingScreen style={styles.overlay} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
