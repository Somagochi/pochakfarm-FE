import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ALERT_IMAGE = require('@/src/shared/assets/images/release-creature-alert.png');
const ALERT_HEADER_IMAGE = require('@/src/shared/assets/images/release-creature-alert-header.png');
const ALERT_TEXT_IMAGE = require('@/src/shared/assets/images/release-creature-alert-text.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/release-creature-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/release-creature-confirm-button.png');
const ALERT_WIDTH = scaleByDeviceWidth(280);
const ALERT_HEIGHT = scaleByDeviceWidth(287);
const HEADER_TOP = scaleByDeviceWidth(24);
const HEADER_WIDTH = scaleByDeviceWidth(245.42);
const HEADER_HEIGHT = scaleByDeviceWidth(81.81);
const CONTENT_GAP = scaleByDeviceWidth(16);
const TEXT_WIDTH = scaleByDeviceWidth(194);
const TEXT_HEIGHT = scaleByDeviceWidth(81);
const BUTTON_TOP =
  HEADER_TOP + HEADER_HEIGHT + CONTENT_GAP + TEXT_HEIGHT + CONTENT_GAP;
const BUTTON_WIDTH = scaleByDeviceWidth(105.15);
const BUTTON_HEIGHT = scaleByDeviceWidth(42);
const BUTTON_GAP = scaleByDeviceWidth(8);
const CLOSE_SIZE = scaleByDeviceWidth(40);

type ReleaseCreatureAlertProps = {
  onClose: () => void;
  onConfirm?: () => void;
};

export function ReleaseCreatureAlert({
  onClose,
  onConfirm,
}: ReleaseCreatureAlertProps) {
  return (
    <View
      accessibilityLabel="자연으로 돌려보내기 확인"
      accessibilityViewIsModal
      style={styles.overlay}
    >
      <View style={styles.alert}>
        <Image
          resizeMode="stretch"
          source={ALERT_IMAGE}
          style={styles.alertImage}
        />
        <Image
          resizeMode="contain"
          source={ALERT_HEADER_IMAGE}
          style={styles.headerImage}
        />
        <Image
          resizeMode="contain"
          source={ALERT_TEXT_IMAGE}
          style={styles.textImage}
        />
        <View style={styles.buttonRow}>
          <Pressable
            accessibilityLabel="취소하기"
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
            <Text style={styles.cancelButtonText}>취소하기</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="여정 보내기"
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
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="확인창 닫기"
          hitSlop={scaleByDeviceWidth(8)}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.closeLine, styles.closeLineForward]} />
          <View style={[styles.closeLine, styles.closeLineBackward]} />
        </Pressable>
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
    backgroundColor: 'rgba(13, 18, 23, 0.68)',
  },
  alert: {
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
  },
  alertImage: {
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
  },
  headerImage: {
    position: 'absolute',
    top: HEADER_TOP,
    alignSelf: 'center',
    width: HEADER_WIDTH,
    height: HEADER_HEIGHT,
  },
  textImage: {
    position: 'absolute',
    top: HEADER_TOP + HEADER_HEIGHT + CONTENT_GAP,
    alignSelf: 'center',
    width: TEXT_WIDTH,
    height: TEXT_HEIGHT,
  },
  buttonRow: {
    position: 'absolute',
    top: BUTTON_TOP,
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: BUTTON_GAP,
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
  cancelButtonText: {
    color: '#684500',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(16),
    includeFontPadding: false,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 2,
    top: scaleByDeviceWidth(6),
    right: scaleByDeviceWidth(5),
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: scaleByDeviceWidth(17),
    height: scaleByDeviceWidth(2.5),
    borderRadius: scaleByDeviceWidth(1.25),
    backgroundColor: '#A7A8A0',
  },
  closeLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineBackward: {
    transform: [{ rotate: '-45deg' }],
  },
  pressed: {
    opacity: 0.55,
  },
});
