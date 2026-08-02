import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { isUsableNickname } from '@/src/features/set-nickname';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BACK_ICON = require('@/src/shared/assets/images/nickname/back-icon.png');
const NICKNAME_DESCRIPTION_IMAGE = require('@/src/shared/assets/images/nickname/nickname-description.png');
const NICKNAME_PROGRESS_IMAGE = require('@/src/shared/assets/images/nickname/nickname-progress.png');
const NICKNAME_TITLE_IMAGE = require('@/src/shared/assets/images/nickname/nickname-title.png');
const NICKNAME_HELPER_TEXT_IMAGE = require('@/src/shared/assets/images/nickname/helper-text.png');
const DUPLICATE_NICKNAME_HELPER_TEXT_IMAGE = require('@/src/shared/assets/images/nickname/duplicate-nickname-helper-text.png');
const NEXT_BUTTON_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/next-button-active.png');
const NEXT_BUTTON_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/next-button.png');

export function NicknameScreen() {
  const insets = useSafeAreaInsets();
  const {
    nickname: initialNickname = '',
    nicknameError,
  } = useLocalSearchParams<{
    nickname?: string;
    nicknameError?: string;
  }>();
  const [nickname, setNicknameValue] = useState(initialNickname);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    nicknameError === 'duplicate' ? '이미 있는 닉네임입니다.' : null,
  );
  const hasDuplicateNicknameError =
    errorMessage === '이미 있는 닉네임입니다.';
  const isNextEnabled = isUsableNickname(nickname) && !errorMessage;
  const isNicknameInvalid =
    nickname.length > 0 && (!isUsableNickname(nickname) || !!errorMessage);

  function handleBackPress() {
    router.replace('/login');
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
          hitSlop={scaleByDeviceWidth(12)}
          onPress={handleBackPress}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
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
          style={[styles.input, isNicknameInvalid && styles.invalidInput]}
          value={nickname}
        />
        {isNicknameInvalid && (
          <View style={styles.helperTextContainer}>
            <Image
              accessibilityLabel={
                hasDuplicateNicknameError
                  ? '이미 있는 닉네임입니다.'
                  : '사용할 수 없는 이름입니다.'
              }
              resizeMode="contain"
              source={
                hasDuplicateNicknameError
                  ? DUPLICATE_NICKNAME_HELPER_TEXT_IMAGE
                  : NICKNAME_HELPER_TEXT_IMAGE
              }
              style={[
                styles.helperTextImage,
                hasDuplicateNicknameError &&
                  styles.duplicateNicknameHelperTextImage,
              ]}
            />
          </View>
        )}
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
          source={
            isNextEnabled
              ? NEXT_BUTTON_ACTIVE_IMAGE
              : NEXT_BUTTON_DISABLED_IMAGE
          }
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
  invalidInput: {
    borderColor: '#EB3D17',
  },
  helperTextContainer: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(8),
    alignItems: 'flex-start',
  },
  helperTextImage: {
    width: scaleByDeviceWidth(120),
    height: scaleByDeviceWidth(9.94),
  },
  duplicateNicknameHelperTextImage: {
    width: scaleByDeviceWidth(110.4),
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
