import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { MARKETING_CONSENT_CONTENT } from '../model/marketingConsentContent';

const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const consentLines = MARKETING_CONSENT_CONTENT.split('\n');

function isSectionTitle(line: string) {
  return /^\d+\.\s/.test(line) || line === '적용일';
}

function isSubsectionTitle(line: string) {
  return [
    '수집·이용 목적',
    '수집·이용 항목',
    '보유 및 이용기간',
    '동의 거부 권리 및 불이익',
    '수신 채널',
    '동의 철회 및 수신 거부',
  ].includes(line);
}

export function MarketingConsentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + scaleByDeviceWidth(10) }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Image source={BACK_ICON_IMAGE} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.title}>마케팅 앱 푸시 수신 동의</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.document}>
          {consentLines.map((line, index) =>
            line ? (
              <Text
                key={`${index}-${line}`}
                style={[
                  styles.documentText,
                  isSectionTitle(line) && styles.sectionTitle,
                  isSubsectionTitle(line) && styles.subsectionTitle,
                ]}
              >
                {line}
              </Text>
            ) : (
              <View key={`space-${index}`} style={styles.paragraphGap} />
            ),
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFAF6' },
  header: {
    width: '100%',
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(28),
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  backIcon: { width: '100%', height: '100%' },
  scrollContent: {
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingTop: scaleByDeviceWidth(12),
    paddingBottom: scaleByDeviceWidth(32),
  },
  document: {
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingVertical: scaleByDeviceWidth(18),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E2DC',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: scaleByDeviceWidth(1) },
    shadowOpacity: 0.08,
    shadowRadius: scaleByDeviceWidth(2),
    elevation: 1,
  },
  documentText: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(13),
    lineHeight: scaleByDeviceWidth(20),
  },
  sectionTitle: {
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(22),
  },
  subsectionTitle: { fontFamily: 'EliceDXNeolli-Bold' },
  paragraphGap: { height: scaleByDeviceWidth(12) },
  pressed: { opacity: 0.6 },
});
