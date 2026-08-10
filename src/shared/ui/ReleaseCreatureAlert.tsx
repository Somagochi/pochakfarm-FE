import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ALERT_IMAGE = require('@/src/shared/assets/images/release-creature-alert.png');
const ALERT_TEXT_IMAGE = require('@/src/shared/assets/images/release-creature-alert-text.png');
const JOURNEY_ALERT_IMAGE = require('@/src/shared/assets/images/release-creature-journey-alert.png');
const JOURNEY_ILLUSTRATION_IMAGE = require('@/src/shared/assets/images/release-creature-journey-illustration.png');
const JOURNEY_TEXT_IMAGE = require('@/src/shared/assets/images/release-creature-journey-text.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/release-creature-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/release-creature-confirm-button.png');
const ALERT_WIDTH = scaleByDeviceWidth(280);
const ALERT_HEIGHT = ALERT_WIDTH * (800 / 1120);
const JOURNEY_ALERT_HEIGHT = ALERT_WIDTH * (1132 / 1120);
const TEXT_WIDTH = scaleByDeviceWidth(234);
const TEXT_HEIGHT = TEXT_WIDTH * (256 / 936);
const TEXT_TOP = scaleByDeviceWidth(30);
const TEXT_BUTTON_GAP = scaleByDeviceWidth(15);
const JOURNEY_ILLUSTRATION_WIDTH = scaleByDeviceWidth(256);
const JOURNEY_ILLUSTRATION_HEIGHT = JOURNEY_ILLUSTRATION_WIDTH * (320 / 1024);
const JOURNEY_ILLUSTRATION_TOP = scaleByDeviceWidth(32);
const JOURNEY_TEXT_WIDTH = scaleByDeviceWidth(194);
const JOURNEY_TEXT_HEIGHT = JOURNEY_TEXT_WIDTH * (324 / 776);
const JOURNEY_TEXT_TOP = scaleByDeviceWidth(122);
const JOURNEY_BUTTON_TOP = scaleByDeviceWidth(224);
const BUTTON_WIDTH = scaleByDeviceWidth(105.25);
const BUTTON_HEIGHT = BUTTON_WIDTH * (168 / 421);
const BUTTON_GAP = scaleByDeviceWidth(8);
const CLOSE_SIZE = scaleByDeviceWidth(36);

type ReleaseCreatureAlertProps = {
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  variant?: 'release' | 'journey';
};

export function ReleaseCreatureAlert({
  isConfirming = false,
  onClose,
  onConfirm,
  variant = 'release',
}: ReleaseCreatureAlertProps) {
  const isJourney = variant === 'journey';

  return (
    <View
      accessibilityLabel={
        isJourney ? '새로운 여정 보내기 확인' : '자연으로 돌려보내기 확인'
      }
      accessibilityViewIsModal
      style={styles.overlay}
    >
      <View
        style={[
          styles.alert,
          { height: isJourney ? JOURNEY_ALERT_HEIGHT : ALERT_HEIGHT },
        ]}
      >
        <Image
          resizeMode="contain"
          source={isJourney ? JOURNEY_ALERT_IMAGE : ALERT_IMAGE}
          style={[
            styles.alertImage,
            { height: isJourney ? JOURNEY_ALERT_HEIGHT : ALERT_HEIGHT },
          ]}
        />
        {isJourney ? (
          <>
            <Image
              resizeMode="contain"
              source={JOURNEY_ILLUSTRATION_IMAGE}
              style={styles.journeyIllustration}
            />
            <Image
              accessibilityLabel="새로운 여정을 시작할까요? 이 동물은 농장을 졸업하고 새로운 여정을 시작해요. 보낸 뒤에는 다시 데려올 수 없어요."
              resizeMode="contain"
              source={JOURNEY_TEXT_IMAGE}
              style={styles.journeyText}
            />
          </>
        ) : (
          <Image
            resizeMode="contain"
            source={ALERT_TEXT_IMAGE}
            style={styles.textImage}
          />
        )}
        <View
          style={[styles.buttonRow, isJourney && styles.journeyButtonRow]}
        >
          <Pressable
            accessibilityLabel="취소하기"
            disabled={isConfirming}
            onPress={onClose}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={CANCEL_BUTTON_IMAGE}
              style={styles.actionButtonImage}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={isJourney ? '여정 보내기' : '돌려보내기'}
            disabled={isConfirming}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={CONFIRM_BUTTON_IMAGE}
              style={styles.actionButtonImage}
            />
            {isConfirming && (
              <ActivityIndicator color="#FFFFFF" size="small" />
            )}
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="확인창 닫기"
          disabled={isConfirming}
          hitSlop={scaleByDeviceWidth(8)}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1217',
  },
  alert: {
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
  },
  alertImage: {
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
  },
  textImage: {
    position: 'absolute',
    top: TEXT_TOP,
    alignSelf: 'center',
    width: TEXT_WIDTH,
    height: TEXT_HEIGHT,
  },
  journeyIllustration: {
    position: 'absolute',
    top: JOURNEY_ILLUSTRATION_TOP,
    alignSelf: 'center',
    width: JOURNEY_ILLUSTRATION_WIDTH,
    height: JOURNEY_ILLUSTRATION_HEIGHT,
  },
  journeyText: {
    position: 'absolute',
    top: JOURNEY_TEXT_TOP,
    alignSelf: 'center',
    width: JOURNEY_TEXT_WIDTH,
    height: JOURNEY_TEXT_HEIGHT,
  },
  buttonRow: {
    position: 'absolute',
    top: TEXT_TOP + TEXT_HEIGHT + TEXT_BUTTON_GAP,
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: BUTTON_GAP,
  },
  journeyButtonRow: {
    top: JOURNEY_BUTTON_TOP,
  },
  actionButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonImage: {
    ...StyleSheet.absoluteFillObject,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 2,
    top: scaleByDeviceWidth(13),
    right: scaleByDeviceWidth(7),
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
  },
  pressed: {
    opacity: 0.55,
  },
});
