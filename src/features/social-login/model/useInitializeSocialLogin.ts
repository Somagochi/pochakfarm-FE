import { useEffect } from 'react';
import NaverLogin from '@react-native-seoul/naver-login';

import { env } from '@/src/shared/config/env';

let isNaverInitialized = false;

export function initializeNaverLogin() {
  if (isNaverInitialized) {
    return;
  }

  if (!env.naver.consumerKey || !env.naver.consumerSecret) {
    throw new Error('네이버 로그인 환경변수가 설정되지 않았습니다.');
  }

  NaverLogin.initialize({
    appName: env.naver.appName,
    consumerKey: env.naver.consumerKey,
    consumerSecret: env.naver.consumerSecret,
    serviceUrlSchemeIOS: env.naver.serviceUrlSchemeIOS,
    disableNaverAppAuthIOS: false,
  });

  isNaverInitialized = true;
}

export function useInitializeSocialLogin() {
  useEffect(() => {
    try {
      initializeNaverLogin();
    } catch (error) {
      console.warn(error);
    }
  }, []);
}

