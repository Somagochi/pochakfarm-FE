import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BACK_ICON = require('@/src/shared/assets/images/nickname/back-icon.png');
const PROGRESS_IMAGE = require('@/src/shared/assets/images/nickname/nickname-progress.png');
const PAW_IMAGE = require('@/src/shared/assets/images/farm-status/paw.png');

const agreements = [
  { label: '[필수] 만 14세 이상입니다', hasDetail: false },
  { label: '[필수] 이용약관', hasDetail: true },
  { label: '[필수] 개인정보 수집 및 이용', hasDetail: true },
  { label: '[선택] 서비스 품질 향상', hasDetail: true },
  { label: '[선택] 이벤트 및 혜택 알림 수신', hasDetail: false },
] as const;

export function TermsAgreementScreen() {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.title}>포착하러 가볼까요?</Text>
        <Text style={styles.description}>아래 사항을 확인하고 동의해주세요</Text>

        <View style={styles.allAgreement}>
          <View style={styles.allCheckbox} />
          <Text style={styles.allAgreementText}>전체 동의</Text>
        </View>

        <View style={styles.agreementList}>
          {agreements.map((agreement) => (
            <View key={agreement.label} style={styles.agreementRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.agreementText}>{agreement.label}</Text>
              {agreement.hasDetail && <Text style={styles.chevron}>›</Text>}
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.completeButton,
          { bottom: insets.bottom + scaleByDeviceWidth(47) },
        ]}
      >
        <Text style={styles.completeButtonText}>가입 완료</Text>
        <Image source={PAW_IMAGE} style={styles.buttonPaw} />
      </View>
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
    transform: [{ scaleX: -1 }],
  },
  content: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(24),
  },
  title: {
    color: '#332016',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(34),
    lineHeight: scaleByDeviceWidth(42),
  },
  description: {
    marginTop: scaleByDeviceWidth(13),
    color: '#171613',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(16),
  },
  allAgreement: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(58),
    marginTop: scaleByDeviceWidth(48),
    paddingHorizontal: scaleByDeviceWidth(22),
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E9DFCA',
    borderRadius: scaleByDeviceWidth(22),
    borderWidth: scaleByDeviceWidth(1),
    backgroundColor: '#FFFFFF',
  },
  allCheckbox: {
    width: scaleByDeviceWidth(22),
    height: scaleByDeviceWidth(22),
    marginRight: scaleByDeviceWidth(10),
    borderColor: '#E6DCC3',
    borderRadius: scaleByDeviceWidth(6),
    borderWidth: scaleByDeviceWidth(2),
  },
  allAgreementText: {
    color: '#34322E',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(18),
  },
  agreementList: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(20),
    gap: scaleByDeviceWidth(28),
  },
  agreementRow: {
    minHeight: scaleByDeviceWidth(30),
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    width: scaleByDeviceWidth(30),
    color: '#EFE8D8',
    fontSize: scaleByDeviceWidth(24),
  },
  agreementText: {
    flex: 1,
    color: '#484640',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
  },
  chevron: {
    color: '#E3D7B9',
    fontSize: scaleByDeviceWidth(25),
  },
  completeButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#D8C48E',
    borderRadius: scaleByDeviceWidth(3),
    borderWidth: scaleByDeviceWidth(1.2),
    backgroundColor: '#FFE7A8',
  },
  completeButtonText: {
    color: '#C9C4B8',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(21),
  },
  buttonPaw: {
    position: 'absolute',
    right: scaleByDeviceWidth(27),
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
    opacity: 0.35,
    tintColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.65,
  },
});
