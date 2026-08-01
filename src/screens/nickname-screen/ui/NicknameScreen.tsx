import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogout } from '@/src/features/logout';
import {
  hasValidNicknameLength,
  isUsableNickname,
} from '@/src/features/set-nickname';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BACK_ICON = require('@/src/shared/assets/images/nickname/back-icon.png');
const NICKNAME_DESCRIPTION_IMAGE = require('@/src/shared/assets/images/nickname/nickname-description.png');
const NICKNAME_PROGRESS_IMAGE = require('@/src/shared/assets/images/nickname/nickname-progress.png');
const NICKNAME_TITLE_IMAGE = require('@/src/shared/assets/images/nickname/nickname-title.png');
const NEXT_BUTTON_IMAGE = require('@/src/shared/assets/images/nickname/next-button.png');

export function NicknameScreen() {
  const insets = useSafeAreaInsets();
  const { isLoading: isLoggingOut, logout } = useLogout();
  const [nickname, setNicknameValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isNextEnabled =
    hasValidNicknameLength(nickname) && !errorMessage;

  async function handleBackPress() {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        '로그아웃 실패',
        error instanceof Error
          ? error.message
          : '로그아웃 중 문제가 발생했습니다.',
      );
    }
  }

  function handleNicknameChange(value: string) {
    setNicknameValue(value);
    setErrorMessage(null);
  }

  function handleNextPress() {
    if (!isUsableNickname(nickname)) {
      setErrorMessage('사용할 수 없는 이름입니다.');
      return;
    }

    router.push({
      pathname: '/terms-agreement',
      params: { nickname },
    });
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          disabled={isLoggingOut}
          hitSlop={scaleByDeviceWidth(12)}
          onPress={handleBackPress}
          style={({ pressed }) => [
            styles.backButton,
            (pressed || isLoggingOut) && styles.pressed,
          ]}
        >
          <Image source={BACK_ICON} style={styles.backIcon} />
        </Pressable>
        <Image
          resizeMode="contain"
          source={NICKNAME_PROGRESS_IMAGE}
          style={styles.progress}
        />
      </View>

      <View style={styles.content}>
        <Image
          accessibilityLabel="반가워요!"
          resizeMode="contain"
          source={NICKNAME_TITLE_IMAGE}
          style={styles.title}
        />
        <Image
          accessibilityLabel="포착팜에서 활동하실 이름을 작성해주세요. 공백 포함 최대 6자"
          resizeMode="contain"
          source={NICKNAME_DESCRIPTION_IMAGE}
          style={styles.descriptionImage}
        />

        <TextInput
          accessibilityLabel="닉네임 입력"
          maxLength={6}
          onChangeText={handleNicknameChange}
          placeholder="이름을 입력해주세요"
          placeholderTextColor="#B7B6AE"
          style={styles.input}
          value={nickname}
        />
        {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!isNextEnabled}
        onPress={handleNextPress}
        style={[
          styles.nextButtonContainer,
          { bottom: insets.bottom + scaleByDeviceWidth(47) },
        ]}
      >
        <Image
          resizeMode="contain"
          source={NEXT_BUTTON_IMAGE}
          style={[styles.nextButton, !isNextEnabled && styles.disabledButton]}
        />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFAF6',
  },
  header: {
    height: scaleByDeviceWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(18),
    bottom: 0,
    width: scaleByDeviceWidth(40),
    height: scaleByDeviceWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
  },
  progress: {
    position: 'absolute',
    bottom: 0,
    width: scaleByDeviceWidth(61.51),
    height: scaleByDeviceWidth(24),
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: scaleByDeviceWidth(45),
    paddingTop: scaleByDeviceWidth(24),
  },
  title: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(42),
  },
  descriptionImage: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(39),
    marginTop: scaleByDeviceWidth(8),
  },
  input: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(56),
    marginTop: scaleByDeviceWidth(40),
    paddingHorizontal: scaleByDeviceWidth(18),
    borderColor: '#E7DCC2',
    borderRadius: scaleByDeviceWidth(14),
    borderWidth: scaleByDeviceWidth(1.2),
    backgroundColor: '#FFFFFF',
    color: '#332016',
    fontFamily: 'EliceDXNeolli-Light',
    fontSize: scaleByDeviceWidth(14),
  },
  errorMessage: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(8),
    color: '#D95C4F',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
  },
  nextButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  nextButtonContainer: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.65,
  },
});
