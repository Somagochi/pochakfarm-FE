import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { PRIVACY_POLICY_CONTENT } from '../model/privacyPolicyContent';

const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const policyLines = PRIVACY_POLICY_CONTENT.split('\n');

type PolicyBlock =
  | { type: 'line'; value: string; index: number }
  | { type: 'table'; headers: string[]; rows: string[][]; index: number };

function parseTableRow(line: string) {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\|(?:\s*:?-+:?\s*\|)+$/.test(line);
}

function buildPolicyBlocks(lines: string[]): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].startsWith('|')) {
      blocks.push({ type: 'line', value: lines[index], index });
      index += 1;
      continue;
    }

    const tableStartIndex = index;
    const tableLines: string[] = [];

    while (index < lines.length && lines[index].startsWith('|')) {
      tableLines.push(lines[index]);
      index += 1;
    }

    const contentRows = tableLines
      .filter((line) => !isTableSeparator(line))
      .map(parseTableRow);
    const [headers = [], ...rows] = contentRows;

    blocks.push({
      type: 'table',
      headers,
      rows,
      index: tableStartIndex,
    });
  }

  return blocks;
}

const policyBlocks = buildPolicyBlocks(policyLines);

function isSectionTitle(line: string) {
  return /^\d+\.\s/.test(line) || line === '부칙';
}

export function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + scaleByDeviceWidth(10) }]}>
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
        <Text style={styles.title}>포착팜 개인정보처리방침</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.document}>
          {policyBlocks.map((block) => {
            if (block.type === 'table') {
              return (
                <View key={`table-${block.index}`} style={styles.table}>
                  {block.rows.map((row, rowIndex) => (
                    <View key={`row-${block.index}-${rowIndex}`} style={styles.tableCard}>
                      {block.headers.map((header, columnIndex) => (
                        <View
                          key={`${header}-${columnIndex}`}
                          style={styles.tableField}
                        >
                          <Text style={styles.tableLabel}>{header}</Text>
                          <Text style={styles.tableValue}>
                            {row[columnIndex] || '-'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            }

            return block.value ? (
              <Text
                key={`${block.index}-${block.value}`}
                style={[
                  styles.documentText,
                  isSectionTitle(block.value) && styles.sectionTitle,
                ]}
              >
                {block.value}
              </Text>
            ) : (
              <View key={`space-${block.index}`} style={styles.paragraphGap} />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFAF6' },
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
  backIcon: { width: '100%', height: '100%' },
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
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(22),
  },
  table: {
    gap: scaleByDeviceWidth(10),
  },
  tableCard: {
    gap: scaleByDeviceWidth(8),
    padding: scaleByDeviceWidth(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD8CF',
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: '#FAF8F3',
  },
  tableField: {
    gap: scaleByDeviceWidth(2),
  },
  tableLabel: {
    color: '#777168',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(17),
  },
  tableValue: {
    color: '#202124',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(19),
  },
  paragraphGap: { height: scaleByDeviceWidth(12) },
  pressed: { opacity: 0.6 },
});
