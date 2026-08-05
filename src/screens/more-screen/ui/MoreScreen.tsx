import { router } from 'expo-router';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserProfile } from '@/src/entities/user';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const PROFILE_CARD_IMAGE = require('@/src/shared/assets/images/more/profile-card.png');
const EXP_ICON_IMAGE = require('@/src/shared/assets/images/more/exp-icon.png');
const COUPON_REGISTRATION_BUTTON_IMAGE = require('@/src/shared/assets/images/more/coupon-registration-button.png');
const SETTINGS_CARD_IMAGE = require('@/src/shared/assets/images/more/settings-card.png');
const ACCOUNT_MANAGEMENT_ROW_IMAGE = require('@/src/shared/assets/images/more/account-management-row.png');
const NOTIFICATION_SETTINGS_ROW_IMAGE = require('@/src/shared/assets/images/more/notification-settings-row.png');
const TERMS_CARD_IMAGE = require('@/src/shared/assets/images/more/terms-card.png');
const NOTICE_ROW_IMAGE = require('@/src/shared/assets/images/more/notice-row.png');
const INQUIRY_ROW_IMAGE = require('@/src/shared/assets/images/more/inquiry-row.png');
const TERMS_OF_SERVICE_ROW_IMAGE = require('@/src/shared/assets/images/more/terms-of-service-row.png');
const MENU_DIVIDER_IMAGE = require('@/src/shared/assets/images/more/menu-divider.png');
const TEMP_CURRENT_EXP = 674;
const TEMP_TOTAL_EXP = 1_000;
const TEMP_REMAINING_EXP = TEMP_TOTAL_EXP - TEMP_CURRENT_EXP;

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + scaleByDeviceWidth(10) },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View
        accessibilityLabel={`사용자 프로필 카드, 닉네임 ${profile?.nickname ?? ''}, 보유 코인 ${profile?.coins.toLocaleString('ko-KR') ?? ''}, 레벨 ${profile?.level ?? ''}`}
        style={styles.profileCard}
      >
        <Image
          accessible={false}
          resizeMode="contain"
          source={PROFILE_CARD_IMAGE}
          style={styles.profileCardImage}
        />
        <Text style={styles.nickname}>{profile?.nickname ?? ''}</Text>
        <Text style={styles.coinBalance}>
          {profile?.coins.toLocaleString('ko-KR') ?? ''}
        </Text>
        <Image
          accessible={false}
          resizeMode="contain"
          source={EXP_ICON_IMAGE}
          style={styles.expIcon}
        />
        <Text style={styles.levelText}>
          {profile ? `Lv. ${profile.level}` : ''}
        </Text>
        <Text style={styles.remainingExpText}>
          다음 레벨까지{' '}
          <Text style={styles.remainingExpValue}>
            {TEMP_REMAINING_EXP.toLocaleString('ko-KR')} EXP
          </Text>
        </Text>
        <View
          accessibilityLabel={`경험치 ${TEMP_CURRENT_EXP.toLocaleString('ko-KR')} / ${TEMP_TOTAL_EXP.toLocaleString('ko-KR')}`}
          style={styles.expProgressBar}
        >
          <View
            style={[
              styles.expProgressFill,
              { width: `${(TEMP_CURRENT_EXP / TEMP_TOTAL_EXP) * 100}%` },
            ]}
          />
          <Text style={styles.expProgressText}>
            {TEMP_CURRENT_EXP.toLocaleString('ko-KR')} /{' '}
            {TEMP_TOTAL_EXP.toLocaleString('ko-KR')}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="쿠폰 등록"
        accessibilityRole="button"
        onPress={() => router.push('/coupon-registration')}
        style={({ pressed }) => [
          styles.couponRegistrationButton,
          pressed && styles.pressed,
        ]}
      >
        <Image
          resizeMode="contain"
          source={COUPON_REGISTRATION_BUTTON_IMAGE}
          style={styles.couponRegistrationButtonImage}
        />
      </Pressable>
      <ImageBackground
        accessibilityLabel="설정"
        resizeMode="contain"
        source={SETTINGS_CARD_IMAGE}
        style={styles.settingsCard}
      >
        <Pressable
          accessibilityLabel="계정 관리"
          accessibilityRole="button"
          onPress={() => router.push('/account-management')}
          style={({ pressed }) => [
            styles.settingsRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={ACCOUNT_MANAGEMENT_ROW_IMAGE}
            style={styles.settingsRowImage}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="알림 설정"
          accessibilityRole="button"
          onPress={() => router.push('/notification-settings')}
          style={({ pressed }) => [
            styles.settingsRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={NOTIFICATION_SETTINGS_ROW_IMAGE}
            style={styles.settingsRowImage}
          />
        </Pressable>
        <View
          pointerEvents="none"
          style={[styles.menuDivider, styles.settingsMenuDivider]}
        >
          <Image
            accessible={false}
            resizeMode="stretch"
            source={MENU_DIVIDER_IMAGE}
            style={styles.menuDividerImage}
          />
        </View>
      </ImageBackground>
      <ImageBackground
        accessibilityLabel="이용안내"
        resizeMode="contain"
        source={TERMS_CARD_IMAGE}
        style={styles.termsCard}
      >
        <Pressable
          accessibilityLabel="공지사항"
          accessibilityRole="button"
          onPress={() => router.push('/notice')}
          style={({ pressed }) => [
            styles.informationRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={NOTICE_ROW_IMAGE}
            style={styles.settingsRowImage}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="문의"
          accessibilityRole="button"
          onPress={() => router.push('/inquiry')}
          style={({ pressed }) => [
            styles.informationRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={INQUIRY_ROW_IMAGE}
            style={styles.settingsRowImage}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="이용약관"
          accessibilityRole="button"
          onPress={() => router.push('/terms-of-service')}
          style={({ pressed }) => [
            styles.informationRow,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={TERMS_OF_SERVICE_ROW_IMAGE}
            style={styles.settingsRowImage}
          />
        </Pressable>
        <View
          pointerEvents="none"
          style={[styles.menuDivider, styles.firstInformationMenuDivider]}
        >
          <Image
            accessible={false}
            resizeMode="stretch"
            source={MENU_DIVIDER_IMAGE}
            style={styles.menuDividerImage}
          />
        </View>
        <View
          pointerEvents="none"
          style={[styles.menuDivider, styles.secondInformationMenuDivider]}
        >
          <Image
            accessible={false}
            resizeMode="stretch"
            source={MENU_DIVIDER_IMAGE}
            style={styles.menuDividerImage}
          />
        </View>
      </ImageBackground>
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
    paddingBottom: scaleByDeviceWidth(10),
  },
  profileCard: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(204),
  },
  profileCardImage: {
    width: '100%',
    height: '100%',
  },
  nickname: {
    position: 'absolute',
    top: scaleByDeviceWidth(28),
    left: scaleByDeviceWidth(20),
    color: '#302F2B',
    fontFamily: 'Pretendard-Regular',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(25),
  },
  coinBalance: {
    position: 'absolute',
    top: scaleByDeviceWidth(87),
    right: scaleByDeviceWidth(54),
    color: '#302F2B',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(13),
    textAlign: 'right',
  },
  expIcon: {
    position: 'absolute',
    top: scaleByDeviceWidth(126.5),
    left: scaleByDeviceWidth(31.5),
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
  },
  levelText: {
    position: 'absolute',
    top: scaleByDeviceWidth(126.5),
    left: scaleByDeviceWidth(51.5),
    color: '#302F2B',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(16),
  },
  remainingExpText: {
    position: 'absolute',
    top: scaleByDeviceWidth(128),
    right: scaleByDeviceWidth(29),
    color: '#675641',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(13),
    textAlign: 'right',
  },
  remainingExpValue: {
    color: '#D08A00',
  },
  expProgressBar: {
    position: 'absolute',
    top: scaleByDeviceWidth(153),
    left: scaleByDeviceWidth(32),
    width: scaleByDeviceWidth(264),
    height: scaleByDeviceWidth(16),
    overflow: 'hidden',
    backgroundColor: '#F7F2E9',
    borderColor: '#EEE4D3',
    borderWidth: scaleByDeviceWidth(1),
    borderRadius: scaleByDeviceWidth(8),
  },
  expProgressFill: {
    height: '100%',
    backgroundColor: '#F8CC51',
  },
  expProgressText: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: '#A16207',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(14),
    textAlign: 'center',
  },
  couponRegistrationButton: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(89),
    marginTop: scaleByDeviceWidth(8),
  },
  couponRegistrationButtonImage: {
    width: '100%',
    height: '100%',
  },
  settingsCard: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(159),
    marginTop: scaleByDeviceWidth(8),
    paddingTop: scaleByDeviceWidth(39),
    alignItems: 'center',
  },
  settingsRow: {
    width: scaleByDeviceWidth(304),
    height: scaleByDeviceWidth(56),
  },
  settingsRowImage: {
    width: '100%',
    height: '100%',
  },
  termsCard: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(217),
    marginTop: scaleByDeviceWidth(8),
    paddingTop: scaleByDeviceWidth(41),
    alignItems: 'center',
  },
  informationRow: {
    width: scaleByDeviceWidth(304),
    height: scaleByDeviceWidth(56),
  },
  menuDivider: {
    position: 'absolute',
    width: scaleByDeviceWidth(272),
    height: scaleByDeviceWidth(1),
  },
  menuDividerImage: {
    width: '100%',
    height: '100%',
  },
  settingsMenuDivider: {
    top: scaleByDeviceWidth(95),
  },
  firstInformationMenuDivider: {
    top: scaleByDeviceWidth(97),
  },
  secondInformationMenuDivider: {
    top: scaleByDeviceWidth(153),
  },
  pressed: {
    opacity: 0.6,
  },
});
