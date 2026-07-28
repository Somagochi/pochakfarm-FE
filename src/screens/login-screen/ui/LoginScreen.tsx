import { StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { LogoutButton } from '@/src/features/logout';
import { SocialLoginButtons } from '@/src/features/social-login';

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>소셜 계정으로 포착팜을 시작해보세요.</Text>
      </View>
      <SocialLoginButtons />
      <View style={styles.logout}>
        <LogoutButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: scaleByDeviceWidth(24),
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: scaleByDeviceWidth(32),
  },
  title: {
    fontSize: scaleByDeviceWidth(28),
    fontWeight: '700',
    marginBottom: scaleByDeviceWidth(12),
  },
  subtitle: {
    fontSize: scaleByDeviceWidth(16),
    color: '#666',
    textAlign: 'center',
  },
  logout: {
    marginTop: scaleByDeviceWidth(12),
  },
});

