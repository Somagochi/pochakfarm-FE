import { useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { login as kakaoSdkLogin } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import { env } from '@/src/shared/config/env';

import { socialLoginApi } from '../api/socialLoginApi';
import { AuthCancelledError } from '../lib/authError';
import { saveServiceToken } from '../lib/tokenStorage';
import type { SocialLoginProvider } from './types';

type AppleAuthError = {
  code?: string;
};

async function getKakaoAccessToken() {
  const kakaoToken = await kakaoSdkLogin();

  if (!kakaoToken.accessToken) {
    throw new Error('카카오 AccessToken이 없습니다.');
  }

  return kakaoToken.accessToken;
}

async function getNaverAccessToken() {
  if (!env.naver.consumerKey || !env.naver.consumerSecret) {
    throw new Error('네이버 로그인 환경변수가 설정되지 않았습니다.');
  }

  const response = await NaverLogin.login();

  if (!response.isSuccess) {
    if (response.failureResponse?.isCancel) {
      throw new AuthCancelledError();
    }

    throw new Error(response.failureResponse?.message ?? '네이버 로그인에 실패했습니다.');
  }

  const accessToken = response.successResponse?.accessToken;

  if (!accessToken) {
    throw new Error('네이버 AccessToken이 없습니다.');
  }

  return accessToken;
}

async function getAppleIdentityToken() {
  if (Platform.OS !== 'ios') {
    throw new Error('애플 로그인은 iOS에서만 사용할 수 있습니다.');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('이 기기에서 애플 로그인을 사용할 수 없습니다.');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('애플 IdentityToken이 없습니다.');
    }

    return credential.identityToken;
  } catch (error) {
    if ((error as AppleAuthError).code === 'ERR_REQUEST_CANCELED') {
      throw new AuthCancelledError();
    }

    throw error;
  }
}

const getProviderToken: Record<SocialLoginProvider, () => Promise<string>> = {
  kakao: getKakaoAccessToken,
  apple: getAppleIdentityToken,
  naver: getNaverAccessToken,
};

export function useSocialLogin() {
  const [loadingProvider, setLoadingProvider] = useState<SocialLoginProvider | null>(null);

  async function login(provider: SocialLoginProvider) {
    try {
      setLoadingProvider(provider);

      const providerToken = await getProviderToken[provider]();
      const serviceToken = await socialLoginApi(provider, providerToken);

      await saveServiceToken(serviceToken);

      return serviceToken;
    } finally {
      setLoadingProvider(null);
    }
  }

  return {
    login,
    loadingProvider,
  };
}

