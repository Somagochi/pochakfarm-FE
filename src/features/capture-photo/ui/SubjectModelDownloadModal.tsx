import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

type SubjectModelDownloadModalProps = {
  errorMessage: string | null;
  onRetry: () => void;
  visible: boolean;
};

export function SubjectModelDownloadModal({
  errorMessage,
  onRetry,
  visible,
}: SubjectModelDownloadModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {errorMessage ? '다운로드에 실패했어요' : '준비하고 있어요'}
          </Text>
          <Text style={styles.description}>
            {errorMessage ??
              '사진에서 동물을 분리하기 위한 모델을 다운로드하고 있어요.'}
          </Text>
          {errorMessage ? (
            <Pressable
              accessibilityLabel="누끼 제거 모델 다시 다운로드"
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          ) : (
            <ActivityIndicator color="#8A6B42" size="large" />
          )}
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
    backgroundColor: 'rgba(13, 18, 23, 0.68)',
  },
  modal: {
    width: '100%',
    maxWidth: scaleByDeviceWidth(312),
    padding: scaleByDeviceWidth(24),
    alignItems: 'center',
    borderRadius: scaleByDeviceWidth(16),
    backgroundColor: '#F8F2E7',
  },
  title: {
    color: '#5F5140',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(24),
  },
  description: {
    marginVertical: scaleByDeviceWidth(16),
    color: '#685A48',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
    textAlign: 'center',
  },
  retryButton: {
    minWidth: scaleByDeviceWidth(112),
    height: scaleByDeviceWidth(44),
    paddingHorizontal: scaleByDeviceWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleByDeviceWidth(10),
    backgroundColor: '#F6C94C',
  },
  retryText: {
    color: '#5F5140',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(15),
  },
  pressed: {
    opacity: 0.65,
  },
});
