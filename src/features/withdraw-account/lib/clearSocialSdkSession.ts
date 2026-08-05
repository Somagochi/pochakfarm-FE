import { unlink as unlinkKakaoAccount } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import type { UserAccount } from '@/src/entities/user';

type SocialLoginProvider = NonNullable<UserAccount['provider']>;

const clearSdkSession: Record<SocialLoginProvider, () => Promise<unknown>> = {
  apple: async () => undefined,
  kakao: unlinkKakaoAccount,
  naver: () => NaverLogin.deleteToken(),
};

export async function clearSocialSdkSession(
  provider: UserAccount['provider'],
) {
  if (!provider) {
    return;
  }

  await clearSdkSession[provider]();
}
