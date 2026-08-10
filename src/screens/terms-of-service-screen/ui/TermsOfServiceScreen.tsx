import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUpdateMarketingConsent } from '@/src/features/update-marketing-consent';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const TERMS_OF_SERVICE_TITLE_IMAGE = require('@/src/shared/assets/images/more/terms-of-service-title.png');
const SERVICE_TERMS_ROW_IMAGE = require('@/src/shared/assets/images/more/service-terms-row.png');
const PRIVACY_POLICY_ROW_IMAGE = require('@/src/shared/assets/images/more/privacy-policy-row.png');
const MARKETING_CONSENT_TITLE_IMAGE = require('@/src/shared/assets/images/more/marketing-consent-title.png');
const MARKETING_SWITCH_DISABLED_IMAGE = require('@/src/shared/assets/images/more/marketing-switch-disabled.png');
const MARKETING_SWITCH_ACTIVE_IMAGE = require('@/src/shared/assets/images/more/marketing-switch-active.png');

function formatMarketingConsentDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const { isLoading, updateMarketingConsent } =
    useUpdateMarketingConsent();
  const [marketingConsentDate, setMarketingConsentDate] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMarketingConsentEnabled = marketingConsentDate !== null;

  async function handleMarketingConsentPress() {
    const nextMarketingConsentEnabled = !isMarketingConsentEnabled;

    try {
      const isUpdated = await updateMarketingConsent(
        nextMarketingConsentEnabled,
      );

      if (!isUpdated) {
        return;
      }

      setMarketingConsentDate(
        nextMarketingConsentEnabled
          ? formatMarketingConsentDate(new Date())
          : null,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '잠시 후 다시 시도해 주세요.',
      );
    }
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + scaleByDeviceWidth(10) },
      ]}
    >
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
        <Image
          accessibilityLabel="이용 약관"
          resizeMode="contain"
          source={TERMS_OF_SERVICE_TITLE_IMAGE}
          style={styles.title}
        />
      </View>

      <Pressable
        accessibilityLabel="서비스 이용 약관"
        accessibilityRole="button"
        onPress={() => router.push('/service-terms-detail')}
        style={({ pressed }) => [styles.termsButton, pressed && styles.pressed]}
      >
        <Image
          resizeMode="contain"
          source={SERVICE_TERMS_ROW_IMAGE}
          style={styles.termsButtonImage}
        />
      </Pressable>

      <Pressable
        accessibilityLabel="개인정보 처리 방침"
        accessibilityRole="button"
        onPress={() => router.push('/privacy-policy')}
        style={({ pressed }) => [
          styles.privacyPolicyButton,
          pressed && styles.pressed,
        ]}
      >
        <Image
          resizeMode="contain"
          source={PRIVACY_POLICY_ROW_IMAGE}
          style={styles.termsButtonImage}
        />
      </Pressable>

      <Pressable
        accessibilityLabel={`마케팅 수신 동의, ${
          isMarketingConsentEnabled ? '수신 동의 상태' : '수신 거부 상태'
        }`}
        accessibilityRole="switch"
        accessibilityState={{
          busy: isLoading,
          checked: isMarketingConsentEnabled,
          disabled: isLoading,
        }}
        disabled={isLoading}
        onPress={handleMarketingConsentPress}
        style={({ pressed }) => [
          styles.marketingConsentButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.marketingConsentTextContainer}>
          <Image
            accessibilityLabel="마케팅 수신 동의"
            resizeMode="contain"
            source={MARKETING_CONSENT_TITLE_IMAGE}
            style={styles.marketingConsentTitle}
          />
          <Text style={styles.marketingConsentDescription}>
            {isMarketingConsentEnabled
              ? `${marketingConsentDate} 마케팅 알림 수신을 동의했습니다`
              : '현재 마케팅 수신 거부 상태입니다'}
          </Text>
        </View>
        <Image
          source={
            isMarketingConsentEnabled
              ? MARKETING_SWITCH_ACTIVE_IMAGE
              : MARKETING_SWITCH_DISABLED_IMAGE
          }
          style={styles.marketingSwitch}
        />
      </Pressable>
      <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FCFAF6',
  },
  header: {
    width: '100%',
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: scaleByDeviceWidth(84),
    height: scaleByDeviceWidth(28),
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  backIcon: {
    width: '100%',
    height: '100%',
  },
  termsButton: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(50),
    marginTop: scaleByDeviceWidth(23),
  },
  termsButtonImage: {
    width: '100%',
    height: '100%',
  },
  privacyPolicyButton: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(50),
    marginTop: scaleByDeviceWidth(8),
  },
  marketingConsentButton: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(68),
    marginTop: scaleByDeviceWidth(8),
    paddingHorizontal: scaleByDeviceWidth(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketingConsentTextContainer: {
    alignItems: 'flex-start',
  },
  marketingConsentTitle: {
    width: scaleByDeviceWidth(104),
    height: scaleByDeviceWidth(14),
  },
  marketingConsentDescription: {
    marginTop: scaleByDeviceWidth(6),
    color: '#77746C',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(9),
    lineHeight: scaleByDeviceWidth(12),
  },
  marketingSwitch: {
    width: scaleByDeviceWidth(44),
    height: scaleByDeviceWidth(24),
  },
  pressed: {
    opacity: 0.65,
  },
});
