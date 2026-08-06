import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import { getAchievementProgressPercent } from '../lib/getAchievementProgressPercent';
import type { Achievement } from '../model/types';

const ACHIEVEMENT_CARD_BACKGROUND = require('@/src/shared/assets/images/collection/achievement-card.png');
const ACHIEVEMENT_CLAIM_BUTTON = require('@/src/shared/assets/images/collection/achievement-claim-button.png');
const ACHIEVEMENT_COMPLETE = require('@/src/shared/assets/images/collection/achievement-complete.png');
const ACHIEVEMENT_PROGRESS_FULL = require('@/src/shared/assets/images/collection/achievement-progress-full.png');
const HIDDEN_ACHIEVEMENT_BADGE = require('@/src/shared/assets/images/collection/hidden-achievement-badge.png');
const HIDDEN_LABEL = require('@/src/shared/assets/images/collection/hidden-label.png');
const UNREGISTERED_ACHIEVEMENT_BADGE = require('@/src/shared/assets/images/collection/unregistered-achievement-badge.png');

type AchievementCardProps = {
  achievement: Achievement;
  isClaiming?: boolean;
  onClaim?: (code: string) => void;
};

export function AchievementCard({
  achievement,
  isClaiming = false,
  onClaim,
}: AchievementCardProps) {
  const current = achievement.progress?.current;
  const target = achievement.progress?.target;
  const hasProgress =
    typeof current === 'number' && typeof target === 'number';
  const progressPercent = achievement.achieved
    ? 100
    : hasProgress
      ? getAchievementProgressPercent(current ?? 0, target ?? 0)
      : 0;
  const canClaim = achievement.achievedInfo?.rewardClaimed === false;
  const badgeSource: ImageSourcePropType = achievement.hidden
    ? HIDDEN_ACHIEVEMENT_BADGE
    : achievement.imageUrl
      ? { uri: achievement.imageUrl }
      : UNREGISTERED_ACHIEVEMENT_BADGE;

  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
      source={ACHIEVEMENT_CARD_BACKGROUND}
      style={styles.card}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={badgeSource}
        style={styles.badge}
      />
      {(achievement.title || achievement.description || achievement.hidden) && (
        <View style={styles.textContent}>
          {(achievement.title || achievement.hidden) && (
            <View style={styles.titleRow}>
              {achievement.title && (
                <Text style={styles.title}>{achievement.title}</Text>
              )}
              {achievement.hidden && (
                <Image
                  accessible={false}
                  resizeMode="contain"
                  source={HIDDEN_LABEL}
                  style={styles.hiddenLabel}
                />
              )}
            </View>
          )}
          {achievement.description && (
            <Text style={styles.description}>
              {achievement.description}
            </Text>
          )}
        </View>
      )}
      {(hasProgress || achievement.achieved || canClaim) && (
        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressBar,
              canClaim && styles.claimableProgressBar,
            ]}
          >
            <Image
              accessible={false}
              resizeMode="stretch"
              source={ACHIEVEMENT_PROGRESS_FULL}
              style={[
                styles.progressBarImage,
                canClaim && styles.claimableProgressBar,
              ]}
            />
            {progressPercent < 100 && (
              <View
                style={[
                  styles.emptyProgress,
                  {
                    left: scaleByDeviceWidth(
                      4 + 172 * (progressPercent / 100),
                    ),
                    width: scaleByDeviceWidth(
                      172 * (1 - progressPercent / 100),
                    ),
                  },
                  progressPercent === 0 && styles.emptyProgressAtStart,
                ]}
              />
            )}
          </View>
          {canClaim ? (
            <Pressable
              accessibilityLabel="업적 보상 받기"
              accessibilityRole="button"
              accessibilityState={{ disabled: isClaiming }}
              disabled={isClaiming || !onClaim}
              hitSlop={scaleByDeviceWidth(4)}
              onPress={() => onClaim?.(achievement.code)}
              style={({ pressed }) => [
                styles.claimButton,
                pressed && styles.claimButtonPressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={ACHIEVEMENT_CLAIM_BUTTON}
                style={styles.claimButtonImage}
              />
            </Pressable>
          ) : achievement.achieved ? (
            <Image
              accessible={false}
              resizeMode="contain"
              source={ACHIEVEMENT_COMPLETE}
              style={styles.completeIcon}
            />
          ) : (
            <Text style={styles.progressText}>{progressPercent}%</Text>
          )}
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(105.48),
  },
  backgroundImage: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(105.48),
  },
  badge: {
    position: 'absolute',
    top: scaleByDeviceWidth(20.01),
    left: scaleByDeviceWidth(17),
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(64),
  },
  textContent: {
    position: 'absolute',
    top: scaleByDeviceWidth(22.01),
    left: scaleByDeviceWidth(93),
    right: scaleByDeviceWidth(17),
  },
  title: {
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(17),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(4),
  },
  hiddenLabel: {
    width: scaleByDeviceWidth(49),
    height: scaleByDeviceWidth(18),
  },
  description: {
    marginTop: scaleByDeviceWidth(4),
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(11),
  },
  progressRow: {
    position: 'absolute',
    top: scaleByDeviceWidth(55.56),
    left: scaleByDeviceWidth(93),
    right: scaleByDeviceWidth(17),
    height: scaleByDeviceWidth(36),
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    width: scaleByDeviceWidth(180),
    height: scaleByDeviceWidth(16),
  },
  progressBarImage: {
    width: scaleByDeviceWidth(180),
    height: scaleByDeviceWidth(16),
  },
  claimableProgressBar: {
    width: scaleByDeviceWidth(157),
  },
  emptyProgress: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    height: scaleByDeviceWidth(8),
    backgroundColor: '#FFFDF8',
    borderTopRightRadius: scaleByDeviceWidth(4),
    borderBottomRightRadius: scaleByDeviceWidth(4),
  },
  emptyProgressAtStart: {
    borderTopLeftRadius: scaleByDeviceWidth(4),
    borderBottomLeftRadius: scaleByDeviceWidth(4),
  },
  progressText: {
    marginLeft: scaleByDeviceWidth(4),
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(12),
  },
  completeIcon: {
    marginLeft: scaleByDeviceWidth(4),
    width: scaleByDeviceWidth(15.55),
    height: scaleByDeviceWidth(15.55),
  },
  claimButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(-37.55),
    right: 0,
    width: scaleByDeviceWidth(57),
    height: scaleByDeviceWidth(36),
  },
  claimButtonImage: {
    width: scaleByDeviceWidth(57),
    height: scaleByDeviceWidth(36),
  },
  claimButtonPressed: {
    opacity: 0.7,
  },
});
