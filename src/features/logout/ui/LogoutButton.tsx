import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useLogout } from '../model/useLogout';

export function LogoutButton() {
  const { isLoading, logout } = useLogout();

  async function handlePress() {
    try {
      await logout();
      Alert.alert('로그아웃 완료', '다시 로그인할 수 있습니다.');
    } catch (error) {
      console.error(error);
      Alert.alert('로그아웃 실패', getLogoutErrorMessage(error));
    }
  }

  return (
    <Pressable
      style={[styles.button, isLoading && styles.disabled]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <Text style={styles.buttonText}>{isLoading ? '로그아웃 중...' : '로그아웃'}</Text>
    </Pressable>
  );
}

function getLogoutErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '로그아웃 중 문제가 발생했습니다.';
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
  },
});
