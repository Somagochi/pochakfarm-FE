import { router } from 'expo-router';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserProfile } from '@/src/entities/user';
import { buildSupportEmailUrl } from '@/src/features/contact-support';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useRefreshOnFocus } from '@/src/shared/lib/navigation/useRefreshOnFocus';

const PROFILE_CARD_IMAGE = require('@/src/shared/assets/images/more/profile-card.png');
const EXP_ICON_IMAGE = require('@/src/shared/assets/images/more/exp-icon.png');
const COUPON_REGISTRATION_BUTTON_IMAGE = require('@/src/shared/assets/images/more/coupon-registration-button.png');
const SETTINGS_CARD_IMAGE = require('@/src/shared/assets/images/more/settings-card.png');
const ACCOUNT_MANAGEMENT_ROW_IMAGE = require('@/src/shared/assets/images/more/account-management-row.png');
const TERMS_CARD_IMAGE = require('@/src/shared/assets/images/more/terms-card.png');
const NOTICE_ROW_IMAGE = require('@/src/shared/assets/images/more/notice-row.png');
const INQUIRY_ROW_IMAGE = require('@/src/shared/assets/images/more/inquiry-row.png');
const TERMS_OF_SERVICE_ROW_IMAGE = require('@/src/shared/assets/images/more/terms-of-service-row.png');
const MENU_DIVIDER_IMAGE = require('@/src/shared/assets/images/more/menu-divider.png');
const NOTICE_INSTAGRAM_URL =
  'https://www.instagram.com/pochakfarm.official/?hl=hr';

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { profile, reload: reloadProfile } = useUserProfile();

  useRefreshOnFocus(reloadProfile);

  const currentExperience = profile?.currentExperience ?? 0;
  const requiredExperience = profile?.requiredExperience ?? 0;
  const remainingExperience = profile?.remainingExperience ?? 0;
  const experienceProgress =
    requiredExperience > 0
      ? Math.min(Math.max(currentExperience / requiredExperience, 0), 1)
      : 0;

  async function handleNoticePress() {
    try {
      await Linking.openURL(NOTICE_INSTAGRAM_URL);
    } catch {
      Alert.alert('링크 열기 실패', '공지사항 페이지를 열 수 없습니다.');
    }
  }

  async function handleInquiryPress() {
    try {
      await Linking.openURL(buildSupportEmailUrl(profile?.nickname));
    } catch {
      Alert.alert(
        '메일 앱 열기 실패',
        '메일 앱이 설치되어 있고 메일 계정이 설정되어 있는지 확인해주세요.',
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
          {profile ? (
            <>
              다음 레벨까지{' '}
              <Text style={styles.remainingExpValue}>
                {remainingExperience.toLocaleString('ko-KR')} EXP
              </Text>
            </>
          ) : null}
        </Text>
        <View
          accessibilityLabel={`경험치 ${currentExperience.toLocaleString('ko-KR')} / ${requiredExperience.toLocaleString('ko-KR')}`}
          style={styles.expProgressBar}
        >
          <View
            style={[
              styles.expProgressFill,
              { width: `${experienceProgress * 100}%` },
            ]}
          />
          <Text style={styles.expProgressText}>
            {profile
              ? `${currentExperience.toLocaleString('ko-KR')} / ${requiredExperience.toLocaleString('ko-KR')}`
              : ''}
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
          onPress={handleNoticePress}
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
          onPress={handleInquiryPress}
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
    fontFamily: 'Pretendard-SemiBold',
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
    height: scaleByDeviceWidth(96),
    marginTop: scaleByDeviceWidth(8),
    paddingTop: scaleByDeviceWidth(31),
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
