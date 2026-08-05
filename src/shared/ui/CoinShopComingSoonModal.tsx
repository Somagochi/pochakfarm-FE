import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const COMING_SOON_IMAGE = require('@/src/shared/assets/images/common/coin-shop-coming-soon.png');

type CoinShopComingSoonModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function CoinShopComingSoonModal({
  onClose,
  visible,
}: CoinShopComingSoonModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="코인 충전 업데이트 안내 닫기"
        accessibilityRole="button"
        accessibilityViewIsModal
        onPress={onClose}
        style={styles.overlay}
      >
        <View pointerEvents="none">
          <Image
            accessibilityLabel="곧 업데이트 될 예정이에요. 조금만 더 기다려주세요"
            resizeMode="contain"
            source={COMING_SOON_IMAGE}
            style={styles.image}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  image: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(189),
  },
});
