export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  posthog: {
    apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '',
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  },
  naver: {
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY ?? '',
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET ?? '',
    appName: process.env.EXPO_PUBLIC_NAVER_APP_NAME ?? 'pochakfarm',
    serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME_IOS ?? 'pochakfarm',
  },
};
