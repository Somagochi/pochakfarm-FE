import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const DIALOG_IMAGE = require('@/src/shared/assets/images/coupon-registration/farm-full-modal/dialog.png');
const TEXT_IMAGE = require('@/src/shared/assets/images/coupon-registration/farm-full-modal/text.png');
const ORGANIZE_BUTTON_IMAGE = require('@/src/shared/assets/images/coupon-registration/farm-full-modal/organize-button.png');

const DIALOG_WIDTH = scaleByDeviceWidth(280);
const DIALOG_HEIGHT = DIALOG_WIDTH * (744 / 1120);
const TEXT_WIDTH = scaleByDeviceWidth(195);
const TEXT_HEIGHT = TEXT_WIDTH * (256 / 780);
const BUTTON_WIDTH = scaleByDeviceWidth(105.25);
const BUTTON_HEIGHT = BUTTON_WIDTH * (168 / 421);

type CouponFarmFullModalProps = {
  onClose: () => void;
  onOrganize: () => void;
  visible: boolean;
};

export function CouponFarmFullModal({
  onClose,
  onOrganize,
  visible,
}: CouponFarmFullModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityLabel="농장 공간 부족 안내"
        accessibilityViewIsModal
        style={styles.overlay}
      >
        <View style={styles.dialog}>
          <Image
            resizeMode="contain"
            source={DIALOG_IMAGE}
            style={styles.dialogImage}
          />
          <Image
            accessibilityLabel="현재 농장에 공간이 없어요. 땅 타일 농장을 정리한 뒤 다시 보상을 수령해주세요"
            resizeMode="contain"
            source={TEXT_IMAGE}
            style={styles.textImage}
          />
          <Pressable
            accessibilityLabel="농장 정리하러 가기"
            accessibilityRole="button"
            onPress={onOrganize}
            style={({ pressed }) => [
              styles.organizeButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={ORGANIZE_BUTTON_IMAGE}
              style={styles.organizeButtonImage}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="농장 공간 부족 안내 닫기"
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
    width: DIALOG_WIDTH,
    height: DIALOG_HEIGHT,
  },
  dialogImage: {
    width: DIALOG_WIDTH,
    height: DIALOG_HEIGHT,
  },
  textImage: {
    position: 'absolute',
    top: scaleByDeviceWidth(30),
    alignSelf: 'center',
    width: TEXT_WIDTH,
    height: TEXT_HEIGHT,
  },
  organizeButton: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(26),
    alignSelf: 'center',
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  organizeButtonImage: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(13),
    right: scaleByDeviceWidth(13),
    width: scaleByDeviceWidth(32),
    height: scaleByDeviceWidth(32),
  },
  pressed: {
    opacity: 0.65,
  },
});
