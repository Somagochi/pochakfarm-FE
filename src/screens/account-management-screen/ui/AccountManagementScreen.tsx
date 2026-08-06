import { useState } from 'react';
import { router } from 'expo-router';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserAccount, useUserProfile } from '@/src/entities/user';
import { LogoutConfirmModal } from '@/src/features/logout';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ACCOUNT_MANAGEMENT_TITLE_IMAGE = require('@/src/shared/assets/images/account-management/title.png');
const ACCOUNT_INFO_BACKGROUND_IMAGE = require('@/src/shared/assets/images/account-management/account-info-background.png');
const LOGOUT_BACKGROUND_IMAGE = require('@/src/shared/assets/images/account-management/logout-background.png');
const ACCOUNT_WITHDRAWAL_ROW_IMAGE = require('@/src/shared/assets/images/account-management/account-withdrawal-row.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const APPLE_ICON_IMAGE = require('@/src/shared/assets/images/account-management/icon-apple.png');
const KAKAO_ICON_IMAGE = require('@/src/shared/assets/images/account-management/icon-kakao.png');
const NAVER_ICON_IMAGE = require('@/src/shared/assets/images/account-management/icon-naver.png');

const PROVIDER_CONTENT = {
  apple: { icon: APPLE_ICON_IMAGE, label: 'Apple' },
  kakao: { icon: KAKAO_ICON_IMAGE, label: '카카오' },
  naver: { icon: NAVER_ICON_IMAGE, label: '네이버' },
} as const;

export function AccountManagementScreen() {
  const insets = useSafeAreaInsets();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const { account } = useUserAccount();
  const { profile } = useUserProfile();
  const accountProvider = account?.provider?.toLowerCase();
  const provider =
    accountProvider === 'apple' ||
    accountProvider === 'kakao' ||
    accountProvider === 'naver'
      ? accountProvider
      : null;
  const providerContent = provider ? PROVIDER_CONTENT[provider] : null;

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
          accessibilityLabel="계정 관리"
          resizeMode="contain"
          source={ACCOUNT_MANAGEMENT_TITLE_IMAGE}
          style={styles.title}
        />
      </View>
      <ImageBackground
        accessibilityLabel="닉네임, 로그인 방식, 이메일 계정 정보"
        resizeMode="contain"
        source={ACCOUNT_INFO_BACKGROUND_IMAGE}
        style={styles.accountInfoBackground}
      >
        <Text numberOfLines={1} style={[styles.accountValue, styles.nickname]}>
          {profile?.nickname ?? ''}
        </Text>
        <View style={styles.loginMethod}>
          {providerContent && (
            <>
              <Image
                source={providerContent.icon}
                style={styles.loginProviderIcon}
              />
              <Text style={styles.accountValue}>{providerContent.label}</Text>
            </>
          )}
        </View>
        <Text numberOfLines={1} style={[styles.accountValue, styles.email]}>
          {account?.email ?? ''}
        </Text>
      </ImageBackground>
      <View style={styles.sectionGap} />
      <ImageBackground
        resizeMode="contain"
        source={LOGOUT_BACKGROUND_IMAGE}
        style={styles.logoutBackground}
      >
        <Pressable
          accessibilityLabel="로그아웃"
          accessibilityRole="button"
          onPress={() => setIsLogoutModalVisible(true)}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        />
        <Pressable
          accessibilityLabel="회원 탈퇴"
          accessibilityRole="button"
          onPress={() => router.push('/account-withdrawal')}
          style={({ pressed }) => [
            styles.accountWithdrawalButton,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={ACCOUNT_WITHDRAWAL_ROW_IMAGE}
            style={styles.accountWithdrawalRow}
          />
        </Pressable>
      </ImageBackground>
      <LogoutConfirmModal
        onClose={() => setIsLogoutModalVisible(false)}
        onLoggedOut={() => router.replace('/login')}
        visible={isLogoutModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
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
    height: scaleByDeviceWidth(19.27),
  },
  accountInfoBackground: {
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(195),
    marginTop: scaleByDeviceWidth(7.48),
  },
  accountValue: {
    color: '#302F2B',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
  },
  nickname: {
    position: 'absolute',
    top: scaleByDeviceWidth(31),
    right: scaleByDeviceWidth(24),
    maxWidth: scaleByDeviceWidth(190),
  },
  loginMethod: {
    position: 'absolute',
    top: scaleByDeviceWidth(85),
    right: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(8),
  },
  loginProviderIcon: {
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  email: {
    position: 'absolute',
    top: scaleByDeviceWidth(144),
    right: scaleByDeviceWidth(24),
    maxWidth: scaleByDeviceWidth(190),
  },
  logoutBackground: {
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(276),
    alignItems: 'center',
  },
  sectionGap: {
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(12),
    backgroundColor: '#FAF5EB',
  },
  logoutButton: {
    position: 'absolute',
    top: 0,
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(50),
  },
  accountWithdrawalButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(66),
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(50),
  },
  accountWithdrawalRow: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
