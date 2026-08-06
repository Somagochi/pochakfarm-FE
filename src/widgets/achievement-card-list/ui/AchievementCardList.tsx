import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import {
  type Achievement,
  AchievementCard,
  useAchievements,
} from '@/src/entities/achievement';
import {
  AchievementClaimRewardModal,
  useClaimAchievement,
} from '@/src/features/claim-achievement';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useRefreshOnFocus } from '@/src/shared/lib/navigation/useRefreshOnFocus';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

export function AchievementCardList() {
  const [claimedAchievement, setClaimedAchievement] =
    useState<Achievement | null>(null);
  const {
    achievements,
    clearError,
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload,
  } = useAchievements();
  const {
    claimAchievement,
    claimingCode,
    clearError: clearClaimError,
    errorMessage: claimErrorMessage,
  } = useClaimAchievement();
  useRefreshOnFocus(reload);
  const claimedBadgeReward = claimedAchievement?.rewards?.find(
    (reward) => reward.type === 'BADGE',
  );
  const claimedCoinReward = claimedAchievement?.rewards?.find(
    (reward) => reward.type === 'COIN',
  );

  return (
    <>
      <FlatList
        contentContainerStyle={styles.content}
        data={achievements}
        keyExtractor={(item) => item.code}
        ListFooterComponent={
          isLoading && achievements.length > 0 ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : null
        }
        onEndReached={hasNext && !isLoading ? loadNextPage : undefined}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            isClaiming={claimingCode === item.code}
            onClaim={(code) => {
              void claimAchievement(code).then(async (isSuccessful) => {
                if (isSuccessful) {
                  const refreshedPage = await reload();
                  const refreshedAchievement = refreshedPage?.content.find(
                    (achievement) => achievement.code === code,
                  );

                  setClaimedAchievement(refreshedAchievement ?? item);
                }
              });
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      <ErrorModal
        message={claimErrorMessage ?? errorMessage}
        onClose={claimErrorMessage ? clearClaimError : clearError}
      />
      <AchievementClaimRewardModal
        badgeImageUrl={claimedAchievement?.imageUrl}
        coinAmount={claimedCoinReward?.amount ?? 300}
        onClose={() => {
          setClaimedAchievement(null);
          void reload();
        }}
        title={claimedBadgeReward?.badgeName ?? '첫 보금자리'}
        visible={claimedAchievement !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF5EB',
  },
  content: {
    alignItems: 'center',
    gap: scaleByDeviceWidth(5),
    paddingTop: scaleByDeviceWidth(16),
    paddingBottom: scaleByDeviceWidth(16),
  },
  loadingIndicator: {
    marginVertical: scaleByDeviceWidth(12),
  },
});
