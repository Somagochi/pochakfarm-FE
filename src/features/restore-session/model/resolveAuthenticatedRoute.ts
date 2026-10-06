import { resetFarms } from '@/src/entities/farm';
import { loadUserProfile, resetUserProfile } from '@/src/entities/user';
import { getServiceToken } from '@/src/shared/lib/auth/tokenStorage';

export type AuthenticatedRoute = '/(tabs)' | '/login';

export async function resolveAuthenticatedRoute(): Promise<AuthenticatedRoute> {
  const token = await getServiceToken();

  if (!token) {
    resetUserProfile();
    resetFarms();
    return '/login';
  }

  try {
    await loadUserProfile({ force: true });

    return '/(tabs)';
  } catch {
    return '/login';
  }
}
