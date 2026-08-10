import { Pressable, StyleSheet, Text } from 'react-native';
import { useState } from 'react';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

import { useLogout } from '../model/useLogout';

export function LogoutButton() {
  const { isLoading, logout } = useLogout();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePress() {
    try {
      await logout();
    } catch (error) {
      console.error(error);
      setErrorMessage(getLogoutErrorMessage(error));
    }
  }

  return (
    <>
    <Pressable
      style={[styles.button, isLoading && styles.disabled]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <Text style={styles.buttonText}>{isLoading ? '로그아웃 중...' : '로그아웃'}</Text>
    </Pressable>
    <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </>
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
    minHeight: scaleByDeviceWidth(48),
    borderRadius: scaleByDeviceWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleByDeviceWidth(16),
    backgroundColor: '#F2F4F7',
    borderWidth: scaleByDeviceWidth(1),
    borderColor: '#D0D5DD',
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#344054',
    fontSize: scaleByDeviceWidth(15),
    fontWeight: '700',
  },
});
