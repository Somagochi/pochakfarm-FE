import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type WithdrawalReason,
  useWithdrawAccount,
} from '@/src/features/withdraw-account';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ACCOUNT_WITHDRAWAL_TITLE_IMAGE = require('@/src/shared/assets/images/account-withdrawal/title.png');
const WITHDRAWAL_WARNING_IMAGE = require('@/src/shared/assets/images/account-withdrawal/withdrawal-warning.png');
const WITHDRAWAL_REASON_GUIDE_IMAGE = require('@/src/shared/assets/images/account-withdrawal/withdrawal-reason-guide.png');
const REASON_PILL_IMAGE = require('@/src/shared/assets/images/account-withdrawal/reason-pill.png');
const WITHDRAW_BUTTON_DISABLED_IMAGE = require('@/src/shared/assets/images/account-withdrawal/withdraw-button-disabled.png');
const WITHDRAW_BUTTON_ACTIVE_IMAGE = require('@/src/shared/assets/images/account-withdrawal/withdraw-button-active.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const CHECKBOX_ACTIVE_IMAGE = require('@/src/shared/assets/images/nickname/checkbox-active.png');
const CHECKBOX_DISABLED_IMAGE = require('@/src/shared/assets/images/nickname/checkbox.png');

const WITHDRAWAL_REASONS = [
  { label: '앱 이용이 불편했어요', value: 'INCONVENIENT' },
  { label: '앱을 자주 사용하지 않아요', value: 'LOW_USAGE' },
  { label: '새로운 계정을 사용하고 싶어요', value: 'NEW_ACCOUNT' },
  { label: '기타', value: 'OTHER' },
] as const;

export function AccountWithdrawalScreen() {
  const insets = useSafeAreaInsets();
  const [selectedReasonIndex, setSelectedReasonIndex] = useState<number | null>(
    null,
  );
  const { isLoading, withdrawAccount } = useWithdrawAccount();
  const isWithdrawalEnabled = selectedReasonIndex !== null && !isLoading;

  async function handleWithdraw() {
    if (selectedReasonIndex === null) {
      return;
    }

    const withdrawalReason: WithdrawalReason =
      WITHDRAWAL_REASONS[selectedReasonIndex].value;

    try {
      const isWithdrawn = await withdrawAccount(withdrawalReason);

      if (isWithdrawn) {
        router.replace('/login');
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        '회원 탈퇴 실패',
        error instanceof Error
          ? error.message
          : '회원 탈퇴 중 문제가 발생했습니다.',
      );
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + scaleByDeviceWidth(10) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
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
          accessibilityLabel="회원 탈퇴"
          resizeMode="contain"
          source={ACCOUNT_WITHDRAWAL_TITLE_IMAGE}
          style={styles.title}
        />
      </View>
      <Image
        accessibilityLabel="정말 탈퇴하시겠어요? 탈퇴하면 보유한 동물 카드, 코인, 레벨 및 활동 기록이 모두 삭제되며 복구할 수 없어요"
        resizeMode="contain"
        source={WITHDRAWAL_WARNING_IMAGE}
        style={styles.withdrawalWarning}
      />
      <Image
        accessibilityLabel="탈퇴 사유를 알려주시면 더 나은 포착팜이 되어 돌아올게요"
        resizeMode="contain"
        source={WITHDRAWAL_REASON_GUIDE_IMAGE}
        style={styles.withdrawalReasonGuide}
      />
      <View style={styles.reasonOptions}>
        {WITHDRAWAL_REASONS.map((reason, index) => (
          <Pressable
            accessibilityLabel={reason.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedReasonIndex === index }}
            disabled={isLoading}
            key={reason.value}
            onPress={() =>
              setSelectedReasonIndex((currentIndex) =>
                currentIndex === index ? null : index,
              )
            }
            style={styles.reasonPill}
          >
            <Image
              accessible={false}
              resizeMode="contain"
              source={REASON_PILL_IMAGE}
              style={styles.reasonPillImage}
            />
            <View pointerEvents="none" style={styles.reasonPillContent}>
              <Image
                source={
                  selectedReasonIndex === index
                    ? CHECKBOX_ACTIVE_IMAGE
                    : CHECKBOX_DISABLED_IMAGE
                }
                style={styles.reasonCheckbox}
              />
              <Text style={styles.reasonText}>{reason.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityLabel="탈퇴하기"
        accessibilityRole="button"
        accessibilityState={{
          busy: isLoading,
          disabled: !isWithdrawalEnabled,
        }}
        disabled={!isWithdrawalEnabled}
        onPress={handleWithdraw}
        style={styles.withdrawButton}
      >
        <Image
          resizeMode="contain"
          source={
            isWithdrawalEnabled
              ? WITHDRAW_BUTTON_ACTIVE_IMAGE
              : WITHDRAW_BUTTON_DISABLED_IMAGE
          }
          style={styles.withdrawButtonImage}
        />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF5EB',
  },
  content: {
    alignItems: 'center',
    paddingBottom: scaleByDeviceWidth(24),
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
    height: scaleByDeviceWidth(19.58),
  },
  withdrawalWarning: {
    width: scaleByDeviceWidth(320),
    height: scaleByDeviceWidth(220.48),
    marginTop: scaleByDeviceWidth(19),
  },
  withdrawalReasonGuide: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(38),
    marginTop: scaleByDeviceWidth(24),
  },
  reasonOptions: {
    marginTop: scaleByDeviceWidth(12),
    gap: scaleByDeviceWidth(8),
  },
  reasonPill: {
    width: scaleByDeviceWidth(320),
    height: scaleByDeviceWidth(52),
  },
  reasonPillImage: {
    width: '100%',
    height: '100%',
  },
  reasonPillContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: scaleByDeviceWidth(22),
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonCheckbox: {
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
    marginRight: scaleByDeviceWidth(10),
  },
  reasonText: {
    color: '#34322E',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
  },
  withdrawButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
    marginTop: scaleByDeviceWidth(50.52),
  },
  withdrawButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
