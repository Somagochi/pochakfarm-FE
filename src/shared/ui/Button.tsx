import { Pressable, StyleSheet, Text } from 'react-native';

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
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
