import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

type ErrorModalProps = {
  message: string | null;
  onClose: () => void;
};

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={message !== null}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>오류</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            accessibilityLabel="오류 메시지 닫기"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
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
    padding: scaleByDeviceWidth(24),
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modal: {
    width: '100%',
    maxWidth: scaleByDeviceWidth(320),
    padding: scaleByDeviceWidth(24),
    alignItems: 'center',
    borderRadius: scaleByDeviceWidth(16),
    backgroundColor: '#FFF9F0',
  },
  title: {
    color: '#3D291C',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(28),
  },
  message: {
    marginTop: scaleByDeviceWidth(12),
    color: '#685A48',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(22),
    textAlign: 'center',
  },
  button: {
    minWidth: scaleByDeviceWidth(96),
    height: scaleByDeviceWidth(44),
    marginTop: scaleByDeviceWidth(24),
    paddingHorizontal: scaleByDeviceWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleByDeviceWidth(10),
    backgroundColor: '#365D20',
  },
  buttonText: {
    color: '#FFF9F0',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(16),
  },
  pressed: {
    opacity: 0.8,
  },
});
