import AsyncStorage from '@react-native-async-storage/async-storage';

export type ServiceToken = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function saveServiceToken(token: ServiceToken) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken),
  ]);
}

export async function getServiceToken(): Promise<ServiceToken | null> {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export async function clearServiceToken() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}
