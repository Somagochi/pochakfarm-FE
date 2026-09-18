import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { AchievementCardList } from '@/src/widgets/achievement-card-list';
import { GymBadgeBoard } from '@/src/widgets/gym-badge-board';

type CollectionTab = 'achievement' | 'gym-badge';

export function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] =
    useState<CollectionTab>('achievement');

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          { marginTop: insets.top + scaleByDeviceWidth(10) },
        ]}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedTab === 'achievement' }}
          onPress={() => setSelectedTab('achievement')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabLabel,
              selectedTab === 'achievement'
                ? styles.activeTabLabel
                : styles.inactiveTabLabel,
            ]}
          >
            업적
          </Text>
          {selectedTab === 'achievement' ? (
            <View style={styles.activeIndicator} />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedTab === 'gym-badge' }}
          onPress={() => setSelectedTab('gym-badge')}
          style={styles.tab}
        >
          <Text
            style={[
              styles.tabLabel,
              selectedTab === 'gym-badge'
                ? styles.activeTabLabel
                : styles.inactiveTabLabel,
            ]}
          >
            관장뱃지
          </Text>
          {selectedTab === 'gym-badge' ? (
            <View style={styles.activeIndicator} />
          ) : null}
        </Pressable>
      </View>

      {selectedTab === 'achievement' ? (
        <AchievementCardList />
      ) : (
        <ScrollView
          contentContainerStyle={styles.badgePageContent}
          showsVerticalScrollIndicator={false}
          style={styles.badgePage}
        >
          <GymBadgeBoard />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: scaleByDeviceWidth(55),
    backgroundColor: '#FFFDF8',
    borderBottomColor: '#EEECE6',
    borderBottomWidth: scaleByDeviceWidth(1),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: scaleByDeviceWidth(8),
  },
  tabLabel: {
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(25),
  },
  activeTabLabel: {
    color: '#302F2B',
  },
  inactiveTabLabel: {
    color: '#AAA99F',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: scaleByDeviceWidth(2),
    backgroundColor: '#F7D34A',
  },
  badgePage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF5EB',
  },
  badgePageContent: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(13),
  },
});
