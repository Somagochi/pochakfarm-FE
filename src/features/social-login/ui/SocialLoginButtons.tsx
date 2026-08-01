import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { env } from '@/src/shared/config/env';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import type { UserProfile } from '@/src/entities/user';

import { isAuthCancelledError } from '../lib/authError';
import { useSocialLogin } from '../model/useSocialLogin';
import type { SocialLoginProvider } from '../model/types';

const APPLE_LOGIN_BUTTON_IMAGE = require('@/src/shared/assets/images/login/apple-login-button.png');
const KAKAO_LOGIN_BUTTON_IMAGE = require('@/src/shared/assets/images/login/kakao-login-button.png');
const NAVER_LOGIN_BUTTON_IMAGE = require('@/src/shared/assets/images/login/naver-login-button.png');

type SocialButton = {
  provider: SocialLoginProvider;
  title: string;
  image: ImageSourcePropType;
};

const socialButtons: SocialButton[] = [
  {
    provider: 'apple',
    title: 'Apple 로그인',
    image: APPLE_LOGIN_BUTTON_IMAGE,
  },
  {
    provider: 'kakao',
    title: '카카오 로그인',
    image: KAKAO_LOGIN_BUTTON_IMAGE,
  },
  {
    provider: 'naver',
    title: '네이버 로그인',
    image: NAVER_LOGIN_BUTTON_IMAGE,
  },
];

type SocialLoginButtonsProps = {
  onLoginSuccess?: (profile: UserProfile) => void;
};

export function SocialLoginButtons({
  onLoginSuccess,
}: SocialLoginButtonsProps) {
  const { login, loadingProvider } = useSocialLogin();

  async function handlePress(provider: SocialLoginProvider) {
    try {
      const profile = await login(provider);
      onLoginSuccess?.(profile);
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
        if (button.provider === 'apple' && Platform.OS !== 'ios') {
          return null;
        }

        const isLoading = loadingProvider === button.provider;
        const isDisabled = loadingProvider !== null;

        return (
          <Pressable
            accessibilityLabel={button.title}
            accessibilityRole="button"
            disabled={isDisabled}
            key={button.provider}
            onPress={() => handlePress(button.provider)}
            style={({ pressed }) => [
              styles.button,
              (pressed || isDisabled) && styles.disabled,
            ]}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={button.image}
              style={styles.buttonImage}
            />
            {isLoading && <View style={styles.loadingOverlay} />}
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

function getLoginErrorMessage(
  provider: SocialLoginProvider,
  error: unknown,
) {
  const apiBaseUrl = env.apiBaseUrl || '(empty)';

  if (error instanceof Error && error.message) {
    return `${getProviderName(provider)} 로그인 중 문제가 발생했습니다.\n\n${error.message}\n\nAPI URL: ${apiBaseUrl}`;
  }

  return `${getProviderName(provider)} 로그인 중 문제가 발생했습니다.\n\nAPI URL: ${apiBaseUrl}`;
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(280),
    gap: scaleByDeviceWidth(4),
  },
  button: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  disabled: {
    opacity: 0.65,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
