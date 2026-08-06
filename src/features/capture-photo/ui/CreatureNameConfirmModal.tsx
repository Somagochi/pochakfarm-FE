import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const MODAL_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/name-confirm-modal.png');
const NAME_WARNING_IMAGE = require('@/src/shared/assets/images/capture/name-confirm-warning.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/name-confirm-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/name-confirm-button.png');

const MODAL_WIDTH = scaleByDeviceWidth(280);
const MODAL_HEIGHT = MODAL_WIDTH * (800 / 1120);
const WARNING_WIDTH = scaleByDeviceWidth(168.25);
const WARNING_HEIGHT = WARNING_WIDTH * (47 / 673);
const BUTTON_WIDTH = scaleByDeviceWidth(105.25);
const BUTTON_HEIGHT = BUTTON_WIDTH * (168 / 421);

type CreatureNameConfirmModalProps = {
  creatureName: string;
  isConfirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function CreatureNameConfirmModal({
  creatureName,
  isConfirming,
  onClose,
  onConfirm,
  visible,
}: CreatureNameConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityLabel={`${creatureName}(으)로 이름을 확정하시겠어요?`}
        accessibilityViewIsModal
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <Image
            resizeMode="contain"
            source={MODAL_BACKGROUND_IMAGE}
            style={styles.modalBackground}
          />

          <View style={styles.content}>
            <Text style={styles.title}>
              <Text style={styles.name}>{creatureName}</Text>(으)로{`\n`}
              이름을 확정하시겠어요?
            </Text>
            <Image
              accessibilityLabel="이름을 정하면 변경할 수 없어요"
              resizeMode="contain"
              source={NAME_WARNING_IMAGE}
              style={styles.warning}
            />
            <View style={styles.buttonRow}>
              <Pressable
                accessibilityLabel="이름 확정 취소하기"
                accessibilityRole="button"
                disabled={isConfirming}
                onPress={onClose}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Image
                  resizeMode="contain"
                  source={CANCEL_BUTTON_IMAGE}
                  style={styles.actionButtonImage}
                />
              </Pressable>
              <Pressable
                accessibilityLabel={`${creatureName}(으)로 이름 확정하기`}
                accessibilityRole="button"
                disabled={isConfirming}
                onPress={onConfirm}
                style={({ pressed }) => [
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
          </View>

          <Pressable
            accessibilityLabel="이름 확정창 닫기"
            accessibilityRole="button"
            hitSlop={scaleByDeviceWidth(8)}
            disabled={isConfirming}
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
  modalBackground: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  content: {
    position: 'absolute',
    top: scaleByDeviceWidth(30),
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  title: {
    color: '#5F5140',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(24),
    textAlign: 'center',
  },
  name: {
    color: '#8A6B42',
    fontFamily: 'Pretendard-SemiBold',
  },
  warning: {
    width: WARNING_WIDTH,
    height: WARNING_HEIGHT,
    marginTop: scaleByDeviceWidth(8),
  },
  buttonRow: {
    marginTop: scaleByDeviceWidth(16),
    flexDirection: 'row',
    columnGap: scaleByDeviceWidth(4),
  },
  actionButtonImage: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(12),
    right: scaleByDeviceWidth(8),
    width: scaleByDeviceWidth(36),
    height: scaleByDeviceWidth(36),
  },
  pressed: {
    opacity: 0.55,
  },
});
