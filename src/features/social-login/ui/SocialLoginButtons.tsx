import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useState } from 'react';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

import { isAuthCancelledError } from '../lib/authError';
import { useSocialLogin } from '../model/useSocialLogin';
import type {
  SocialLoginProvider,
  SocialLoginResult,
} from '../model/types';

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
  onLoginSuccess?: (result: SocialLoginResult) => void;
};

export function SocialLoginButtons({
  onLoginSuccess,
}: SocialLoginButtonsProps) {
  const { login, loadingProvider } = useSocialLogin();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePress(provider: SocialLoginProvider) {
    try {
      const result = await login(provider);
      onLoginSuccess?.(result);
    } catch (error) {
      if (isAuthCancelledError(error)) {
        return;
      }

      console.error(error);
      setErrorMessage(getLoginErrorMessage(provider, error));
    }
  }

  return (
    <>
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
    <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </>
  );
}

function getLoginErrorMessage(
  _provider: SocialLoginProvider,
  error: unknown,
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '로그인 중 문제가 발생했습니다.';
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
