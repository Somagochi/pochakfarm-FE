import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocialLoginButtons } from '@/src/features/social-login';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const PAW_IMAGE = require('@/src/shared/assets/images/farm-status/paw.png');
const LOGIN_REQUIRED_IMAGE = require('@/src/shared/assets/images/login/login-required.png');
const LOGIN_DESCRIPTION_IMAGE = require('@/src/shared/assets/images/login/login-description.png');
const LOGIN_DIVIDER_IMAGE = require('@/src/shared/assets/images/login/login-divider.png');
const LOGIN_LATER_IMAGE = require('@/src/shared/assets/images/login/login-later.png');
const SKIP_BUTTON_HIT_SLOP = scaleByDeviceWidth(12);
const PAW_POSITIONS = [
  { left: '16%', top: '1%', size: 30, rotation: '-10deg' },
  { left: '48%', top: '8%', size: 24, rotation: '8deg' },
  { left: '4%', top: '13%', size: 28, rotation: '-6deg' },
  { left: '79%', top: '13%', size: 28, rotation: '12deg' },
  { left: '27%', top: '20%', size: 27, rotation: '-12deg' },
  { left: '91%', top: '22%', size: 27, rotation: '9deg' },
  { left: '43%', top: '26%', size: 25, rotation: '-8deg' },
  { left: '6%', top: '31%', size: 28, rotation: '7deg' },
  { left: '68%', top: '31%', size: 28, rotation: '-9deg' },
  { left: '33%', top: '39%', size: 27, rotation: '10deg' },
  { left: '82%', top: '38%', size: 28, rotation: '-7deg' },
  { left: '13%', top: '47%', size: 29, rotation: '8deg' },
  { left: '60%', top: '45%', size: 27, rotation: '-8deg' },
  { left: '2%', top: '54%', size: 27, rotation: '-9deg' },
  { left: '42%', top: '58%', size: 27, rotation: '7deg' },
  { left: '86%', top: '57%', size: 29, rotation: '-7deg' },
  { left: '18%', top: '65%', size: 28, rotation: '10deg' },
  { left: '65%', top: '68%', size: 28, rotation: '-6deg' },
  { left: '39%', top: '75%', size: 26, rotation: '8deg' },
  { left: '89%', top: '77%', size: 28, rotation: '-10deg' },
  { left: '5%', top: '86%', size: 28, rotation: '7deg' },
  { left: '53%', top: '89%', size: 27, rotation: '-7deg' },
] as const;

export function LoginScreen() {
  const moveToFarm = () => router.replace('/(tabs)');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <PawPattern />

      <View style={styles.heading}>
        <Image
          accessibilityLabel="로그인이 필요해요"
          resizeMode="contain"
          source={LOGIN_REQUIRED_IMAGE}
          style={styles.titleImage}
        />
        <Image
          accessibilityLabel="농장 저장과 친구 방문을 위해 계정이 필요해요"
          resizeMode="contain"
          source={LOGIN_DESCRIPTION_IMAGE}
          style={styles.descriptionImage}
        />
      </View>

      <View style={styles.loginArea}>
        <SocialLoginButtons onLoginSuccess={moveToFarm} />
        <Image
          resizeMode="contain"
          source={LOGIN_DIVIDER_IMAGE}
          style={styles.dividerImage}
        />
        <Pressable
          accessibilityLabel="로그인 나중에 하기"
          accessibilityRole="button"
          hitSlop={SKIP_BUTTON_HIT_SLOP}
          onPress={moveToFarm}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={LOGIN_LATER_IMAGE}
            style={styles.skipImage}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PawPattern() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PAW_POSITIONS.map((paw, index) => (
        <Image
          key={`${paw.left}-${paw.top}-${index}`}
          resizeMode="contain"
          source={PAW_IMAGE}
          style={{
            position: 'absolute',
            top: paw.top,
            left: paw.left,
            width: scaleByDeviceWidth(paw.size),
            height: scaleByDeviceWidth(paw.size),
            opacity: 0.045,
            tintColor: '#C7A66A',
            transform: [{ rotate: paw.rotation }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  heading: {
    alignItems: 'center',
    marginTop: scaleByDeviceWidth(50),
  },
  titleImage: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(84),
  },
  descriptionImage: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(38),
    marginTop: scaleByDeviceWidth(16),
  },
  loginArea: {
    width: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(272),
    alignSelf: 'center',
  },
  dividerImage: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(12),
    marginTop: scaleByDeviceWidth(4),
  },
  skipButton: {
    width: scaleByDeviceWidth(81.15),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(16),
    alignSelf: 'center',
  },
  skipImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
