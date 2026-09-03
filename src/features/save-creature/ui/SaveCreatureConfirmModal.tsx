import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorDialog } from '@/src/shared/ui/ErrorModal';

const MODAL_IMAGE = require('@/src/shared/assets/images/farm/save-confirm-modal.png');
const TEXT_IMAGE = require('@/src/shared/assets/images/farm/save-confirm-text.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/save-confirm-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/save-confirm-button.png');
const MODAL_WIDTH = scaleByDeviceWidth(280);
const MODAL_HEIGHT = MODAL_WIDTH * (832 / 1120);
const TEXT_WIDTH = scaleByDeviceWidth(179);
const TEXT_HEIGHT = TEXT_WIDTH * (256 / 716);
const TEXT_TOP = scaleByDeviceWidth(30);
const TEXT_BUTTON_GAP = scaleByDeviceWidth(16);
const BUTTON_WIDTH = scaleByDeviceWidth(126);
const BUTTON_HEIGHT = scaleByDeviceWidth(42);
const BUTTON_GAP = scaleByDeviceWidth(4);
const CLOSE_SIZE = scaleByDeviceWidth(36);

type SaveCreatureConfirmModalProps = {
  errorMessage?: string | null;
  isConfirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onErrorClose?: () => void;
  visible: boolean;
};

export function SaveCreatureConfirmModal({
  errorMessage = null,
  isConfirming,
  onClose,
  onConfirm,
  onErrorClose = onClose,
  visible,
}: SaveCreatureConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityLabel="선택한 농장 위치에 저장하기 확인"
        accessibilityViewIsModal
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <Image
            resizeMode="contain"
            source={MODAL_IMAGE}
            style={styles.modalImage}
          />
          <Image
            resizeMode="contain"
            source={TEXT_IMAGE}
            style={styles.textImage}
          />
          <View style={styles.buttonRow}>
            <Pressable
              accessibilityLabel="저장 취소하기"
              accessibilityRole="button"
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
              accessibilityLabel="선택한 위치에 저장하기"
              accessibilityRole="button"
              disabled={isConfirming}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                (pressed || isConfirming) && styles.pressed,
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
            accessibilityLabel="저장 확인창 닫기"
            accessibilityRole="button"
            disabled={isConfirming}
            hitSlop={scaleByDeviceWidth(8)}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          />
        </View>
        <ErrorDialog message={errorMessage} onClose={onErrorClose} />
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
  modal: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  modalImage: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  textImage: {
    position: 'absolute',
    top: TEXT_TOP,
    alignSelf: 'center',
    width: TEXT_WIDTH,
    height: TEXT_HEIGHT,
  },
  buttonRow: {
    position: 'absolute',
    top: TEXT_TOP + TEXT_HEIGHT + TEXT_BUTTON_GAP,
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: BUTTON_GAP,
  },
  actionButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  actionButtonImage: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(13),
    right: scaleByDeviceWidth(7),
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
  },
  pressed: {
    opacity: 0.55,
  },
});
