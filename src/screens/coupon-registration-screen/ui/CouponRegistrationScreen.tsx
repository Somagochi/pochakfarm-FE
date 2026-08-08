import { useState } from 'react';
import { router } from 'expo-router';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CouponFarmFullModal,
  useRedeemCoupon,
} from '@/src/features/redeem-coupon';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const COUPON_REGISTRATION_TITLE_IMAGE = require('@/src/shared/assets/images/coupon-registration/title.png');
const USAGE_WARNING_IMAGE = require('@/src/shared/assets/images/coupon-registration/usage-warning.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const NEXT_BUTTON_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/next-button-active.png');
const NEXT_BUTTON_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/next-button.png');

export function CouponRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const {
    clearError,
    closeFarmFullModal,
    errorMessage,
    isFarmFull,
    isLoading,
    redeemCoupon,
  } = useRedeemCoupon();
  const [couponNumber, setCouponNumber] = useState('');
  const isNextEnabled = couponNumber.trim().length > 0 && !isLoading;

  function handleCouponNumberChange(value: string) {
    setCouponNumber(value);
    clearError();
  }

  async function handleNextPress() {
    if (!isNextEnabled) {
      return;
    }

    Keyboard.dismiss();

    const trimmedCouponNumber = couponNumber.trim();
    const reward = await redeemCoupon(trimmedCouponNumber);

    if (reward) {
      router.push({
        pathname: '/coupon-result',
        params: {
          cardImageUrl: reward.cardImageUrl,
          cardType: reward.cardType,
          couponCode: trimmedCouponNumber,
          tier: reward.tier,
        },
      });
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
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Image source={BACK_ICON_IMAGE} style={styles.backIcon} />
        </Pressable>
        <Image
          accessibilityLabel="쿠폰 등록"
          resizeMode="contain"
          source={COUPON_REGISTRATION_TITLE_IMAGE}
          style={styles.title}
        />
      </View>
      <Image
        accessibilityLabel="부당한 방법으로 쿠폰을 이용하는 경우 운영정책에 따라 계정 사용이 제한될 수 있어요"
        resizeMode="contain"
        source={USAGE_WARNING_IMAGE}
        style={styles.usageWarning}
      />
      <TextInput
        accessibilityLabel="쿠폰 번호 입력"
        autoCapitalize="characters"
        autoCorrect={false}
        onChangeText={handleCouponNumberChange}
        onSubmitEditing={() => void handleNextPress()}
        placeholder="쿠폰 번호 입력"
        placeholderTextColor="#AAA9A2"
        returnKeyType="done"
        style={[styles.couponInput, errorMessage && styles.invalidInput]}
        value={couponNumber}
      />
      {errorMessage && (
        <View style={styles.helperTextContainer}>
          <Text accessibilityRole="alert" style={styles.helperText}>
            {errorMessage}
          </Text>
        </View>
      )}
      <Pressable
        accessibilityLabel="다음으로"
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: !isNextEnabled }}
        disabled={!isNextEnabled}
        onPress={() => void handleNextPress()}
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
      <CouponFarmFullModal
        onClose={closeFarmFullModal}
        onOrganize={() => {
          closeFarmFullModal();
          router.replace('/(tabs)/farm');
        }}
        visible={isFarmFull}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FAF5EB',
  },
  header: {
    width: '100%',
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    width: scaleByDeviceWidth(84),
    height: scaleByDeviceWidth(28),
  },
  usageWarning: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(64),
    marginTop: scaleByDeviceWidth(42),
  },
  couponInput: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(56),
    marginTop: scaleByDeviceWidth(32),
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingVertical: 0,
    borderColor: '#E7DCC2',
    borderRadius: scaleByDeviceWidth(14),
    borderWidth: scaleByDeviceWidth(1),
    backgroundColor: '#FFFFFF',
    color: '#332016',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
    textAlignVertical: 'center',
  },
  invalidInput: {
    borderColor: '#EB3D17',
  },
  helperTextContainer: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(8),
    alignItems: 'flex-start',
  },
  helperText: {
    color: '#EB3D17',
    fontFamily: 'EliceDXNeolli-Light',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  nextButtonContainer: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
  },
  nextButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.65,
  },
});
