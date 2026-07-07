import { Alert, Platform, StyleSheet, Text, Pressable, View } from 'react-native';

import { env } from '@/src/shared/config/env';

import { isAuthCancelledError } from '../lib/authError';
import { useSocialLogin } from '../model/useSocialLogin';
import type { SocialLoginProvider } from '../model/types';

type SocialButton = {
  provider: SocialLoginProvider;
  title: string;
  backgroundColor: string;
  color: string;
};

const socialButtons: SocialButton[] = [
  {
    provider: 'kakao',
    title: '카카오로 로그인',
    backgroundColor: '#FEE500',
    color: '#191600',
  },
  {
    provider: 'naver',
    title: '네이버로 로그인',
    backgroundColor: '#03C75A',
    color: '#FFFFFF',
  },
  {
    provider: 'apple',
    title: 'Apple로 로그인',
    backgroundColor: '#111111',
    color: '#FFFFFF',
  },
];

export function SocialLoginButtons() {
  const { login, loadingProvider } = useSocialLogin();

  async function handlePress(provider: SocialLoginProvider) {
    try {
      await login(provider);
      Alert.alert('로그인 완료', '포착팜에 오신 것을 환영합니다.');
    } catch (error) {
      if (isAuthCancelledError(error)) {
        return;
      }

      console.error(error);
      Alert.alert('로그인 실패', getLoginErrorMessage(provider, error));
    }
  }

  return (
    <View style={styles.container}>
      {socialButtons.map((button) => {
        const isLoading = loadingProvider === button.provider;
        const isDisabled =
          loadingProvider !== null || (button.provider === 'apple' && Platform.OS !== 'ios');

        return (
          <Pressable
            key={button.provider}
            style={[
              styles.button,
              { backgroundColor: button.backgroundColor },
              isDisabled && styles.disabled,
            ]}
            onPress={() => handlePress(button.provider)}
            disabled={isDisabled}
          >
            <Text style={[styles.buttonText, { color: button.color }]}>
              {isLoading ? '로그인 중...' : button.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getProviderName(provider: SocialLoginProvider) {
  const providerName: Record<SocialLoginProvider, string> = {
    kakao: '카카오',
    apple: '애플',
    naver: '네이버',
  };

  return providerName[provider];
}

function getLoginErrorMessage(provider: SocialLoginProvider, error: unknown) {
  const apiBaseUrl = env.apiBaseUrl || '(empty)';

  if (error instanceof Error && error.message) {
    return `${getProviderName(provider)} 로그인 중 문제가 발생했습니다.\n\n${error.message}\n\nAPI URL: ${apiBaseUrl}`;
  }

  return `${getProviderName(provider)} 로그인 중 문제가 발생했습니다.\n\nAPI URL: ${apiBaseUrl}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
