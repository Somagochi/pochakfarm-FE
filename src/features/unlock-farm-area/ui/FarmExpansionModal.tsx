import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const MODAL_IMAGE = require('@/src/shared/assets/images/farm/farm-expansion-modal.png');
const TEXT_IMAGE = require('@/src/shared/assets/images/farm/farm-expansion-text.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/farm-expansion-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/farm-expansion-confirm-button.png');
const MODAL_WIDTH = scaleByDeviceWidth(280);
const MODAL_HEIGHT = MODAL_WIDTH * (832 / 1120);
const TEXT_WIDTH = scaleByDeviceWidth(191);
const TEXT_HEIGHT = scaleByDeviceWidth(86);
const TEXT_TOP = scaleByDeviceWidth(30);
const TEXT_BUTTON_GAP = scaleByDeviceWidth(16);
const BUTTON_WIDTH = scaleByDeviceWidth(105.15);
const BUTTON_HEIGHT = scaleByDeviceWidth(42);

type FarmExpansionModalProps = {
  floorNumber: number | null;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss?: () => void;
};

export function FarmExpansionModal({
  floorNumber,
  isConfirming = false,
  onClose,
  onConfirm,
  onDismiss,
}: FarmExpansionModalProps) {
  return (
    <Modal
      animationType="fade"
      onDismiss={onDismiss}
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={floorNumber !== null}
    >
      <View
        accessibilityLabel={`${floorNumber ?? ''}층 공간 확장 확인`}
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
              accessibilityLabel="취소하기"
              accessibilityRole="button"
              disabled={isConfirming}
              onPress={onClose}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                resizeMode="stretch"
                source={CANCEL_BUTTON_IMAGE}
                style={styles.actionButtonImage}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="1000코인 사용"
              accessibilityRole="button"
              disabled={isConfirming}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                resizeMode="stretch"
                source={CONFIRM_BUTTON_IMAGE}
                style={styles.actionButtonImage}
              />
              {isConfirming ? (
                <ActivityIndicator color="#684500" size="small" />
              ) : null}
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="공간 확장 확인창 닫기"
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
    columnGap: scaleByDeviceWidth(4),
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
    top: scaleByDeviceWidth(7),
    right: scaleByDeviceWidth(7),
    width: scaleByDeviceWidth(28),
    height: scaleByDeviceWidth(28),
  },
  pressed: {
    opacity: 0.55,
  },
});
