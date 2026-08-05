import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { hasCompletedOnboarding } from '@/src/features/complete-onboarding';
import {
  resolveAuthenticatedRoute,
  type AuthenticatedRoute,
} from '@/src/features/restore-session';
import { AppSplashScreen } from '@/src/screens/splash-screen';

type EntryRoute = AuthenticatedRoute | '/onboarding';

export default function Page() {
  const [entryRoute, setEntryRoute] = useState<EntryRoute | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function resolveEntryRoute() {
      const isOnboardingCompleted = await hasCompletedOnboarding();

      if (!isOnboardingCompleted) {
        return '/onboarding' as const;
      }

      return resolveAuthenticatedRoute();
    }

    resolveEntryRoute()
      .then((route) => {
        if (isMounted) {
          setEntryRoute(route);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEntryRoute('/onboarding');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!entryRoute) {
    return <AppSplashScreen />;
  }

  return <Redirect href={entryRoute} />;
}
