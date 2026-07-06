const { expo } = require('./app.json');

const kakaoAppKey =
  process.env.KAKAO_NATIVE_APP_KEY ?? process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
const naverUrlScheme =
  process.env.NAVER_SERVICE_URL_SCHEME_IOS ??
  process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME_IOS ??
  expo.scheme ??
  'pochakfarm';

const configuredByAppConfig = [
  '@react-native-seoul/kakao-login',
  '@react-native-seoul/naver-login',
  'expo-build-properties',
];

const plugins = expo.plugins.filter((plugin) => {
  const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;

  return !configuredByAppConfig.includes(pluginName);
});

if (kakaoAppKey) {
  plugins.push([
    '@react-native-seoul/kakao-login',
    {
      kakaoAppKey,
      kotlinVersion: '2.1.20',
    },
  ]);
}

plugins.push([
  '@react-native-seoul/naver-login',
  {
    urlScheme: naverUrlScheme,
  },
]);

plugins.push([
  'expo-build-properties',
  {
    android: {
      extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
    },
  },
]);

module.exports = {
  expo: {
    ...expo,
    plugins,
    extra: {
      ...expo.extra,
      eas: {
        ...expo.extra?.eas,
        projectId: '3c781a21-7b8c-4233-a664-df7d0d3d1091',
      },
    },
  },
};
