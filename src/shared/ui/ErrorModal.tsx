import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const MODAL_BACKGROUND = require('@/src/shared/assets/images/error-modal-default.png');
const CONFIRM_BUTTON_BACKGROUND = require('@/src/shared/assets/images/error-modal-confirm-button.png');
const MODAL_WIDTH = scaleByDeviceWidth(300);
const MODAL_HEIGHT = MODAL_WIDTH * (576 / 1200);
const CLOSE_BUTTON_SIZE = scaleByDeviceWidth(36);
const ACTION_BUTTON_WIDTH = scaleByDeviceWidth(105.25);
const ACTION_BUTTON_HEIGHT = scaleByDeviceWidth(42);

type ErrorModalProps = {
  message: string | null;
  onClose: () => void;
};

export function ErrorDialog({ message, onClose }: ErrorModalProps) {
  if (message === null) return null;

  return (
    <View accessibilityViewIsModal style={styles.overlay}>
      <View style={styles.modal}>
        <Image
          resizeMode="contain"
          source={MODAL_BACKGROUND}
          style={styles.modalBackground}
        />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={2}
          style={styles.message}
        >
          {message}
        </Text>
        <Pressable
          accessibilityLabel="오류 메시지 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="stretch"
            source={CONFIRM_BUTTON_BACKGROUND}
            style={styles.buttonBackground}
          />
          <Text style={styles.buttonText}>확인</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="오류 메시지 닫기"
          accessibilityRole="button"
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

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={message !== null}
    >
      <ErrorDialog message={message} onClose={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleByDeviceWidth(24),
    backgroundColor: 'rgba(13, 18, 23, 0.68)',
    zIndex: 100,
  },
  modal: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    position: 'absolute',
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  message: {
    position: 'absolute',
    top: scaleByDeviceWidth(28),
    width: scaleByDeviceWidth(190),
    color: '#685A48',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(22),
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(26),
    width: ACTION_BUTTON_WIDTH,
    height: ACTION_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBackground: {
    position: 'absolute',
    width: ACTION_BUTTON_WIDTH,
    height: ACTION_BUTTON_HEIGHT,
  },
  buttonText: {
    color: '#FFF9F0',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    right: scaleByDeviceWidth(18),
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
  },
  pressed: {
    opacity: 0.8,
  },
});
