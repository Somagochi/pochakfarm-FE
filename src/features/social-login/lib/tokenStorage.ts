import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ServiceToken } from '../model/types';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function saveServiceToken(token: ServiceToken) {
  return Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken),
  ]);
}
