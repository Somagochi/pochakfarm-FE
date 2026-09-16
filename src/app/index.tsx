import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { hasCompletedOnboarding } from '@/src/features/complete-onboarding';
import {
  discardStoredBattle,
  restoreStoredBattle,
} from '@/src/features/resume-battle';
import { resolveAuthenticatedRoute } from '@/src/features/restore-session';
import { AppSplashScreen } from '@/src/screens/splash-screen';

type EntryRoute = Href;

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

      const authenticatedRoute = await resolveAuthenticatedRoute();

      if (authenticatedRoute !== '/(tabs)') {
        return authenticatedRoute;
      }

      try {
        const resumedBattle = await restoreStoredBattle();

        if (!resumedBattle) {
          return authenticatedRoute;
        }

        const { session, state } = resumedBattle;

        if (state.status === 'ABANDONED') {
          await discardStoredBattle();
          return authenticatedRoute;
        }

        if (state.status === 'FINISHED') {
          await discardStoredBattle();
          return {
            pathname: '/battle-result',
            params: {
              battleId: String(state.battleId),
              battleResult: state.result ?? undefined,
              coach: session.coach,
              gymLeaderId: String(state.gymLeaderId),
              npcParty: session.npcParty,
              party: session.party,
              reward: state.reward
                ? JSON.stringify(state.reward)
                : undefined,
            },
          } as const;
        }

        return {
          pathname: '/battle-arena',
          params: {
            battleId: String(state.battleId),
            coach: session.coach,
            initialBattleState: JSON.stringify(state),
            npcParty: session.npcParty,
            party: session.party,
          },
        } as const;
      } catch {
        return authenticatedRoute;
      }
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
