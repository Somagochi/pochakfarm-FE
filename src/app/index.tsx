import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { hasCompletedOnboarding } from '@/src/features/complete-onboarding';
import { AppSplashScreen } from '@/src/screens/splash-screen';

type EntryRoute = '/login' | '/onboarding';

export default function Page() {
  const [entryRoute, setEntryRoute] = useState<EntryRoute | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    hasCompletedOnboarding()
      .then((isCompleted) => {
        if (isMounted) {
          setEntryRoute(isCompleted ? '/login' : '/onboarding');
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

  if (entryRoute === '/onboarding') {
    return <Redirect href="./onboarding" />;
  }

  return <Redirect href="/login" />;
}
