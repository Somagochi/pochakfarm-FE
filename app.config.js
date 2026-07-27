const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue = ''] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadLocalEnv();

const kakaoAppKey =
  process.env.KAKAO_NATIVE_APP_KEY ?? process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

const configuredByAppConfig = [
  '@react-native-seoul/kakao-login',
  '@react-native-seoul/naver-login',
  'expo-build-properties',
];

module.exports = ({ config }) => {
  const naverUrlScheme =
    process.env.NAVER_SERVICE_URL_SCHEME_IOS ??
    process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME_IOS ??
    config.scheme ??
    'pochakfarm';
  const plugins = (config.plugins ?? []).filter((plugin) => {
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
  } else {
    console.warn(
      '[app.config] KAKAO_NATIVE_APP_KEY 또는 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY가 없어 카카오 네이티브 설정을 건너뜁니다.',
    );
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
        minSdkVersion: 24,
      },
    },
  ]);

  plugins.push('./plugins/with-android-cleartext-network');
  plugins.push('./plugins/with-subject-segmentation');

  return {
    ...config,
    owner: 'somagochi2026',
    plugins,
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId: '731d8550-fe31-4f47-9128-df9b0a8a1580',
      },
    },
  };
};
