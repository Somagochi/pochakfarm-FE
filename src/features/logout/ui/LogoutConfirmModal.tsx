import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { useLogout } from '../model/useLogout';

const DIALOG_IMAGE = require('@/src/shared/assets/images/account-management/logout-dialog.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/account-management/logout-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/account-management/logout-confirm-button.png');

type LogoutConfirmModalProps = {
  onClose: () => void;
  onLoggedOut: () => void;
  visible: boolean;
};

export function LogoutConfirmModal({
  onClose,
  onLoggedOut,
  visible,
}: LogoutConfirmModalProps) {
  const { isLoading, logout } = useLogout();

  async function handleConfirm() {
    try {
      await logout();
      onClose();
      onLoggedOut();
    } catch (error) {
      Alert.alert(
        '로그아웃 실패',
        error instanceof Error && error.message
          ? error.message
          : '로그아웃 중 문제가 발생했습니다.',
      );
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityLabel="로그아웃 확인"
        accessibilityViewIsModal
        style={styles.overlay}
      >
        <View style={styles.dialog}>
          <Image
            resizeMode="contain"
            source={DIALOG_IMAGE}
            style={styles.dialogImage}
          />
          <Pressable
            accessibilityLabel="로그아웃 창 닫기"
            accessibilityRole="button"
            disabled={isLoading}
            hitSlop={scaleByDeviceWidth(8)}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          />
          <View style={styles.buttonRow}>
            <Pressable
              accessibilityLabel="로그아웃 취소하기"
              accessibilityRole="button"
              disabled={isLoading}
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
              accessibilityLabel="로그아웃하기"
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading }}
              disabled={isLoading}
              onPress={() => void handleConfirm()}
              style={({ pressed }) => [
                styles.actionButton,
                (pressed || isLoading) && styles.pressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={CONFIRM_BUTTON_IMAGE}
                style={styles.actionButtonImage}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 18, 23, 0.68)',
  },
  dialog: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(171),
  },
  dialogImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(13),
    right: scaleByDeviceWidth(13),
    width: scaleByDeviceWidth(32),
    height: scaleByDeviceWidth(32),
  },
  buttonRow: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(26),
    alignSelf: 'center',
    flexDirection: 'row',
    gap: scaleByDeviceWidth(8),
  },
  actionButton: {
    width: scaleByDeviceWidth(105.25),
    height: scaleByDeviceWidth(42),
  },
  actionButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
