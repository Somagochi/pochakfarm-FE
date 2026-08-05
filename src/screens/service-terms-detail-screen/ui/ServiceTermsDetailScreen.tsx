import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { TERMS_OF_SERVICE_CONTENT } from '../model/termsOfServiceContent';

const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');

const termsLines = TERMS_OF_SERVICE_CONTENT.split('\n');

function isSectionTitle(line: string) {
  return /^제\d+조(?:\s|\()/.test(line) || line === '부칙';
}

export function ServiceTermsDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + scaleByDeviceWidth(10) },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Image source={BACK_ICON_IMAGE} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.title}>포착팜 서비스 이용약관</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.document}>
          {termsLines.map((line, index) => {
            if (!line) {
              return <View key={`space-${index}`} style={styles.paragraphGap} />;
            }

            return (
              <Text
                key={`${index}-${line}`}
                style={[
                  styles.documentText,
                  isSectionTitle(line) && styles.sectionTitle,
                ]}
              >
                {line}
              </Text>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFAF6',
  },
  header: {
    width: '100%',
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(28),
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  backIcon: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingTop: scaleByDeviceWidth(12),
    paddingBottom: scaleByDeviceWidth(32),
  },
  document: {
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingVertical: scaleByDeviceWidth(18),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E2DC',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: scaleByDeviceWidth(1) },
    shadowOpacity: 0.08,
    shadowRadius: scaleByDeviceWidth(2),
    elevation: 1,
  },
  documentText: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(13),
    lineHeight: scaleByDeviceWidth(20),
  },
  sectionTitle: {
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(22),
  },
  paragraphGap: {
    height: scaleByDeviceWidth(12),
  },
  pressed: {
    opacity: 0.6,
  },
});
