import { usePathname } from 'expo-router';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { PropsWithChildren, useEffect } from 'react';

import { env } from '@/src/shared/config/env';
import { setAnalyticsClient } from '@/src/shared/lib/analytics';

function PostHogAnalyticsBridge() {
  const posthog = usePostHog();

  useEffect(() => {
    setAnalyticsClient({
      capture: (event, properties) => posthog.capture(event, properties),
    });

    return () => setAnalyticsClient(null);
  }, [posthog]);

  return null;
}

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
        enableSessionReplay: false,
        host: env.posthog.host,
        sessionReplayConfig: {
          captureLog: false,
          maskAllImages: true,
          maskAllSandboxedViews: true,
          maskAllTextInputs: true,
          sampleRate: 1,
        },
      }}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
      debug={__DEV__}
    >
      <PostHogAnalyticsBridge />
      <PostHogScreenTracker />
      {children}
    </PostHogProvider>
  );
}
