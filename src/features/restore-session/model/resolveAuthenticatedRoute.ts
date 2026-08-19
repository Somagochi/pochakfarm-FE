import { getUserProfileApi } from '@/src/entities/user';
import { getServiceToken } from '@/src/shared/lib/auth/tokenStorage';

export type AuthenticatedRoute = '/(tabs)' | '/login';

export async function resolveAuthenticatedRoute(): Promise<AuthenticatedRoute> {
  const token = await getServiceToken();

  if (!token) {
    return '/login';
  }

  try {
    await getUserProfileApi();

    return '/(tabs)';
  } catch {
    return '/login';
  }
}
