import { usePathname } from 'expo-router';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { PropsWithChildren, useEffect } from 'react';

import { env } from '@/src/shared/config/env';

function PostHogScreenTracker() {
  const pathname = usePathname();
  const posthog = usePostHog();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    void posthog.screen(pathname);
  }, [pathname, posthog]);

  return null;
}

export function AppPostHogProvider({ children }: PropsWithChildren) {
  if (!env.posthog.apiKey) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={env.posthog.apiKey}
      options={{
        captureAppLifecycleEvents: true,
        host: env.posthog.host,
      }}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
      debug={__DEV__}
    >
      <PostHogScreenTracker />
      {children}
    </PostHogProvider>
  );
}
