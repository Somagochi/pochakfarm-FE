import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSetNickname } from '@/src/features/set-nickname';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const BACK_ICON = require('@/src/shared/assets/images/nickname/back-icon.png');
const PROGRESS_IMAGE = require('@/src/shared/assets/images/nickname/terms-progress.png');
const TERMS_TITLE_IMAGE = require('@/src/shared/assets/images/nickname/terms-title.png');
const TERMS_DESCRIPTION_IMAGE = require('@/src/shared/assets/images/nickname/terms-description.png');
const ALL_AGREEMENT_BACKGROUND = require('@/src/shared/assets/images/nickname/all-agreement-background.png');
const CHECKBOX_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/checkbox-active.png');
const CHECKBOX_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/checkbox.png');
const AGREEMENT_CHECK_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/agreement-check-active.png');
const AGREEMENT_CHECK_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/agreement-check-disabled.png');
const COMPLETE_BUTTON_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/complete-button-active.png');
const COMPLETE_BUTTON_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/complete-button-disabled.png');
const CHEVRON_RIGHT_IMAGE = require('@/src/shared/assets/images/nickname/chevron-right.png');

const agreements = [
  { label: '[필수] 만 14세 이상입니다', hasDetail: false },
  { label: '[필수] 이용약관', hasDetail: true },
  { label: '[필수] 개인정보 수집 및 이용', hasDetail: true },
  { label: '[선택] 서비스 품질 향상', hasDetail: true },
  { label: '[선택] 이벤트 및 혜택 알림 수신', hasDetail: false },
] as const;

export function TermsAgreementScreen() {
  const insets = useSafeAreaInsets();
  const { nickname = '' } = useLocalSearchParams<{ nickname?: string }>();
  const {
    clearError,
    errorMessage,
    isLoading,
    setNickname,
  } = useSetNickname();
  const [checkedAgreements, setCheckedAgreements] = useState<boolean[]>(
    agreements.map(() => false),
  );
  const isAllAgreed = checkedAgreements.every(Boolean);
  const isCompleteEnabled =
    checkedAgreements.slice(0, 3).every(Boolean) && !isLoading;

  function handleAllAgreementPress() {
    const nextValue = !isAllAgreed;
    setCheckedAgreements(agreements.map(() => nextValue));
  }

  function handleAgreementPress(index: number) {
    setCheckedAgreements((current) => {
      const next = current.map((isChecked, currentIndex) =>
        currentIndex === index ? !isChecked : isChecked,
      );
      return next;
    });
  }

  function handleAgreementDetailPress(label: string) {
    Alert.alert(label, '약관 상세 내용은 준비 중입니다.');
  }

  async function handleCompletePress() {
    try {
      const isNicknameUpdated = await setNickname(nickname);

      if (isNicknameUpdated) {
        router.replace('/(tabs)/farm');
        return;
      }

      router.replace({
        pathname: '/nickname',
        params: {
          nickname,
          nicknameError: 'duplicate',
        },
      });
    } catch (error) {
      Alert.alert(
        '가입 실패',
        error instanceof Error
          ? error.message
          : '가입 처리 중 문제가 발생했습니다.',
      );
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Image source={BACK_ICON} style={styles.backIcon} />
        </Pressable>
        <Image
          resizeMode="contain"
          source={PROGRESS_IMAGE}
          style={styles.progress}
        />
      </View>

      <View style={styles.content}>
        <Image
          accessibilityLabel="포착하러 가볼까요?"
          resizeMode="contain"
          source={TERMS_TITLE_IMAGE}
          style={styles.titleImage}
        />
        <Image
          accessibilityLabel="아래 사항을 확인하고 동의해주세요"
          resizeMode="contain"
          source={TERMS_DESCRIPTION_IMAGE}
          style={styles.descriptionImage}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isAllAgreed }}
          onPress={handleAllAgreementPress}
          style={({ pressed }) => [
            styles.allAgreement,
            pressed && styles.pressed,
          ]}
        >
          <ImageBackground
            resizeMode="stretch"
            source={ALL_AGREEMENT_BACKGROUND}
            style={styles.allAgreementBackground}
          >
            <Image
              source={
                isAllAgreed
                  ? CHECKBOX_ACTIVE_IMAGE
                  : CHECKBOX_DISABLED_IMAGE
              }
              style={styles.allCheckbox}
            />
            <Text style={styles.allAgreementText}>전체 동의</Text>
          </ImageBackground>
        </Pressable>

        <View style={styles.agreementList}>
          {agreements.map((agreement, index) => (
            <View key={agreement.label} style={styles.agreementRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checkedAgreements[index] }}
                onPress={() => handleAgreementPress(index)}
                style={({ pressed }) => [
                  styles.agreementToggle,
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  source={
                    checkedAgreements[index]
                      ? AGREEMENT_CHECK_ACTIVE_IMAGE
                      : AGREEMENT_CHECK_DISABLED_IMAGE
                  }
                  style={styles.agreementCheck}
                />
                <Text style={styles.agreementText}>{agreement.label}</Text>
              </Pressable>
              {agreement.hasDetail && (
                <Pressable
                  accessibilityLabel={`${agreement.label} 상세 보기`}
                  accessibilityRole="button"
                  hitSlop={scaleByDeviceWidth(8)}
                  onPress={() => handleAgreementDetailPress(agreement.label)}
                  style={({ pressed }) => [
                    styles.chevronButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    source={CHEVRON_RIGHT_IMAGE}
                    style={styles.chevronImage}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityLabel="가입 완료"
        accessibilityRole="button"
        disabled={!isCompleteEnabled}
        onPress={handleCompletePress}
        style={[
          styles.completeButtonContainer,
          { bottom: insets.bottom + scaleByDeviceWidth(47) },
        ]}
      >
        <Image
          resizeMode="contain"
          source={
            isCompleteEnabled
              ? COMPLETE_BUTTON_ACTIVE_IMAGE
              : COMPLETE_BUTTON_DISABLED_IMAGE
          }
          style={styles.completeButton}
        />
      </Pressable>
      <ErrorModal message={errorMessage} onClose={clearError} />
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
    paddingTop: scaleByDeviceWidth(24),
  },
  titleImage: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(42),
  },
  descriptionImage: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(19),
    marginTop: scaleByDeviceWidth(8),
  },
  allAgreement: {
    width: scaleByDeviceWidth(320),
    height: scaleByDeviceWidth(52),
    marginTop: scaleByDeviceWidth(40),
  },
  allAgreementBackground: {
    flex: 1,
    paddingHorizontal: scaleByDeviceWidth(22),
    flexDirection: 'row',
    alignItems: 'center',
  },
  allCheckbox: {
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
    marginRight: scaleByDeviceWidth(10),
  },
  allAgreementText: {
    color: '#34322E',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
  },
  agreementList: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(20),
    gap: scaleByDeviceWidth(20),
  },
  agreementRow: {
    minHeight: scaleByDeviceWidth(24),
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementCheck: {
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
    marginRight: scaleByDeviceWidth(6),
  },
  agreementText: {
    flex: 1,
    color: '#484640',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
  },
  chevronButton: {
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronImage: {
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
  },
  completeButtonContainer: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
  },
  completeButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  pressed: {
    opacity: 0.65,
  },
});
