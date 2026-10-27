import { preloadFarm, resetFarms } from '@/src/entities/farm';
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
    const profileRequest = loadUserProfile({ force: true });
    // 인증 확인을 기다리는 동안 첫 농장 데이터와 이미지를 함께 준비합니다.
    void preloadFarm('GROUND');
    await profileRequest;

    return '/(tabs)';
  } catch {
    return '/login';
  }
}
