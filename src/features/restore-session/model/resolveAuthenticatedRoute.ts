import { getUserProfileApi } from '@/src/entities/user';
import { getServiceToken } from '@/src/shared/lib/auth/tokenStorage';

export type AuthenticatedRoute = '/(tabs)' | '/login' | '/nickname';

export async function resolveAuthenticatedRoute(): Promise<AuthenticatedRoute> {
  const token = await getServiceToken();

  if (!token) {
    return '/login';
  }

  try {
    const profile = await getUserProfileApi();

    return profile.nickname ? '/(tabs)' : '/nickname';
  } catch {
    return '/login';
  }
}
