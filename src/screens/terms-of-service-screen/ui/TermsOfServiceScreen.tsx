import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { TERMS_OF_SERVICE_CONTENT } from '../model/termsOfServiceContent';

const termsLines = TERMS_OF_SERVICE_CONTENT.split('\n');

function isSectionTitle(line: string) {
  return /^제\d+조\s/.test(line) || line === '부칙';
}

export function TermsOfServiceScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>포착팜 서비스 이용약관</Text>
        <Pressable
          accessibilityLabel="이용약관 닫기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <View style={[styles.closeLine, styles.closeLineForward]} />
          <View style={[styles.closeLine, styles.closeLineBackward]} />
        </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFAF6',
  },
  header: {
    height: scaleByDeviceWidth(76),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(28),
  },
  closeButton: {
    position: 'absolute',
    right: scaleByDeviceWidth(18),
    width: scaleByDeviceWidth(28),
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: scaleByDeviceWidth(21),
    height: scaleByDeviceWidth(1.5),
    borderRadius: scaleByDeviceWidth(1),
    backgroundColor: '#202124',
  },
  closeLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineBackward: {
    transform: [{ rotate: '-45deg' }],
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
