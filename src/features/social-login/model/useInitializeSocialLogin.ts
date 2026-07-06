import { useEffect } from 'react';
import NaverLogin from '@react-native-seoul/naver-login';

import { env } from '@/src/shared/config/env';

export function useInitializeSocialLogin() {
  useEffect(() => {
    if (!env.naver.consumerKey || !env.naver.consumerSecret) {
      return;
    }

    NaverLogin.initialize({
      appName: env.naver.appName,
      consumerKey: env.naver.consumerKey,
      consumerSecret: env.naver.consumerSecret,
      serviceUrlSchemeIOS: env.naver.serviceUrlSchemeIOS,
      disableNaverAppAuthIOS: false,
    });
  }, []);
}

