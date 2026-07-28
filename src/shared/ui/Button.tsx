import { Pressable, StyleSheet, Text } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function Button({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable style={[styles.button, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingVertical: scaleByDeviceWidth(12),
    borderRadius: scaleByDeviceWidth(999),
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
