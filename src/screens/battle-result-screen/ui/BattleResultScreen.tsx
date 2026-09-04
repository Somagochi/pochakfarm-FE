import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isBattleCoachId, type BattleCoachId } from '@/src/entities/battle';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleHeader } from '@/src/widgets/battle-header';

const VIEW_BADGES_BUTTON = require('@/src/shared/assets/images/battle/view-badges-button.png');
const NEXT_COACH_BUTTON = require('@/src/shared/assets/images/battle/next-coach-button.png');
const NEXT_COACH_BUTTON_DISABLED = require('@/src/shared/assets/images/battle/next-coach-button-disabled.png');
const VICTORY_REWARD_PANEL = require('@/src/shared/assets/images/battle/victory-reward-panel.png');
const VICTORY_REWARD_TITLE = require('@/src/shared/assets/images/battle/victory-reward-title.png');
const DEFEAT_REWARD_TITLE = require('@/src/shared/assets/images/battle/defeat-reward-title.png');
const COIN_REWARD_ICON = require('@/src/shared/assets/images/battle/coin-reward-icon.png');
const EXPERIENCE_REWARD_ICON = require('@/src/shared/assets/images/battle/experience-reward-icon.png');
const FIRST_CLEAR_REWARD_PANEL = require('@/src/shared/assets/images/battle/first-clear-reward-panel.png');
const FIRST_CLEAR_REWARD_TITLE = require('@/src/shared/assets/images/battle/first-clear-reward-title.png');
const FIRST_CLEAR_BADGE = require('@/src/shared/assets/images/battle/first-clear-badge.png');
const ACHIEVEMENT_PROGRESS_FULL = require('@/src/shared/assets/images/collection/achievement-progress-full.png');
const COACH_RESULT_PANEL = require('@/src/shared/assets/images/battle/coach-result-panel.png');
const MORU_RESULT_CARD = require('@/src/shared/assets/images/battle/moru-result-card.png');
const MORU_CREATURE_INFO_CARD = require('@/src/shared/assets/images/battle/moru-creature-info-card.png');

const COACH_NAMES: Record<BattleCoachId, string> = {
  moru: '모루',
  haru: '하루',
  nio: '니오',
  raon: '라온',
  byeoli: '별이',
  gaon: '가온',
  daon: '다온',
  ion: '이온',
};

const COACH_TYPE_LABELS: Record<BattleCoachId, string> = {
  moru: '땅',
  haru: '하늘',
  nio: '바다',
  raon: '혼합',
  byeoli: '우주',
  gaon: '혼합',
  daon: '혼합',
  ion: '혼합',
};

export function BattleResultScreen() {
  const { battleResult, coach } = useLocalSearchParams<{
    battleResult?: string | string[];
    coach?: string | string[];
  }>();
  const battleResultParam = Array.isArray(battleResult)
    ? battleResult[0]
    : battleResult;
  const isVictory = battleResultParam !== 'LOSE';
  const coachParam = Array.isArray(coach) ? coach[0] : coach;
  const coachId = coachParam && isBattleCoachId(coachParam) ? coachParam : 'moru';
  const coachName = COACH_NAMES[coachId];
  const coachType = COACH_TYPE_LABELS[coachId];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader
        showRewardBanner={false}
        subtitle={
          isVictory
            ? `${coachType} 관장 ${coachName}를 격파했어요!`
            : `${coachType} 관장 ${coachName}를 격파하지 못했어요`
        }
        title={isVictory ? '관장 격파!' : '격파 실패'}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <ImageBackground
          resizeMode="stretch"
          source={COACH_RESULT_PANEL}
          style={styles.coachPanel}
        >
          <Image
            resizeMode="stretch"
            source={MORU_RESULT_CARD}
            style={styles.coachCard}
          />
          <Image
            resizeMode="stretch"
            source={MORU_CREATURE_INFO_CARD}
            style={styles.opponentInfo}
          />
        </ImageBackground>

        <ImageBackground
          resizeMode="stretch"
          source={VICTORY_REWARD_PANEL}
          style={styles.rewardSection}
        >
          <Image
            resizeMode="contain"
            source={
              isVictory ? VICTORY_REWARD_TITLE : DEFEAT_REWARD_TITLE
            }
            style={styles.rewardTitle}
          />
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Image source={COIN_REWARD_ICON} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>+300코인</Text>
            </View>
            <View style={styles.rewardItem}>
              <Image source={EXPERIENCE_REWARD_ICON} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>+328EXP</Text>
            </View>
          </View>
        </ImageBackground>

        <ImageBackground
          resizeMode="stretch"
          source={FIRST_CLEAR_REWARD_PANEL}
          style={styles.firstClearSection}
        >
          <Image
            resizeMode="contain"
            source={FIRST_CLEAR_REWARD_TITLE}
            style={styles.firstClearRewardTitle}
          />
          <View style={styles.badgeSummary}>
            <Image resizeMode="contain" source={FIRST_CLEAR_BADGE} style={styles.badgeImage} />
            <Text style={styles.badgeName}>{coachType} 뱃지</Text>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badgeProgressArea}>
            <Text style={styles.badgeProgressLabel}>현재 획득 뱃지</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <Image
                  resizeMode="stretch"
                  source={ACHIEVEMENT_PROGRESS_FULL}
                  style={styles.progressBarImage}
                />
                <View style={styles.emptyProgress} />
              </View>
              <Text style={styles.progressCount}>2/8</Text>
            </View>
          </View>
        </ImageBackground>

      </ScrollView>
      <View style={styles.actionsBar}>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="뱃지 보기"
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)/battle')}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Image source={VIEW_BADGES_BUTTON} style={styles.actionButtonImage} />
          </Pressable>
          <Pressable
            accessibilityLabel="다음 관장"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isVictory }}
            disabled={!isVictory}
            onPress={() => router.replace('/(tabs)/battle')}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Image
              source={
                isVictory ? NEXT_COACH_BUTTON : NEXT_COACH_BUTTON_DISABLED
              }
              style={styles.actionButtonImage}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(8),
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingBottom: scaleByDeviceWidth(24),
  },
  coachPanel: {
    position: 'relative',
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(251),
    marginTop: scaleByDeviceWidth(8),
    overflow: 'hidden',
  },
  coachCard: {
    position: 'absolute',
    top: scaleByDeviceWidth(39.5),
    left: scaleByDeviceWidth(14),
    width: scaleByDeviceWidth(118),
    height: scaleByDeviceWidth(111.5),
  },
  opponentInfo: {
    position: 'absolute',
    left: scaleByDeviceWidth(14),
    bottom: scaleByDeviceWidth(15),
    width: scaleByDeviceWidth(118),
    height: scaleByDeviceWidth(80),
  },
  rewardSection: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(97),
    marginTop: scaleByDeviceWidth(30),
    justifyContent: 'center',
  },
  rewardTitle: {
    position: 'absolute',
    top: scaleByDeviceWidth(-16),
    left: scaleByDeviceWidth(110),
    width: scaleByDeviceWidth(116),
    height: scaleByDeviceWidth(32),
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: scaleByDeviceWidth(22),
    paddingTop: scaleByDeviceWidth(12),
    paddingHorizontal: scaleByDeviceWidth(24),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(8),
  },
  rewardIcon: {
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  rewardText: {
    color: '#9A805F',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  firstClearSection: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(147),
    marginTop: scaleByDeviceWidth(28),
  },
  firstClearRewardTitle: {
    position: 'absolute',
    top: scaleByDeviceWidth(-16),
    left: scaleByDeviceWidth(102),
    width: scaleByDeviceWidth(132),
    height: scaleByDeviceWidth(32),
  },
  badgeSummary: {
    position: 'absolute',
    top: scaleByDeviceWidth(25),
    left: scaleByDeviceWidth(25),
    width: scaleByDeviceWidth(92),
    alignItems: 'center',
  },
  badgeImage: {
    width: scaleByDeviceWidth(76),
    height: scaleByDeviceWidth(76 * (320 / 315)),
  },
  badgeName: {
    marginTop: scaleByDeviceWidth(5),
    color: '#45382C',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(21),
  },
  badgeDivider: {
    position: 'absolute',
    top: scaleByDeviceWidth(43),
    left: scaleByDeviceWidth(117),
    width: scaleByDeviceWidth(1),
    height: scaleByDeviceWidth(72),
    backgroundColor: '#E8DFD2',
  },
  badgeProgressArea: {
    position: 'absolute',
    top: scaleByDeviceWidth(54),
    left: scaleByDeviceWidth(132),
    width: scaleByDeviceWidth(188),
  },
  badgeProgressLabel: {
    color: '#947857',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(19),
    textAlign: 'center',
  },
  progressRow: {
    marginTop: scaleByDeviceWidth(13),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(4),
  },
  progressBar: {
    position: 'relative',
    width: scaleByDeviceWidth(160),
    height: scaleByDeviceWidth(16),
  },
  progressBarImage: {
    width: '100%',
    height: '100%',
  },
  emptyProgress: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    left: scaleByDeviceWidth(4 + 152 * 0.2),
    width: scaleByDeviceWidth(152 * 0.8),
    height: scaleByDeviceWidth(8),
    borderTopRightRadius: scaleByDeviceWidth(4),
    borderBottomRightRadius: scaleByDeviceWidth(4),
    backgroundColor: '#FFFDF8',
  },
  progressCount: {
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(12),
  },
  actions: {
    width: scaleByDeviceWidth(320),
    flexDirection: 'row',
    gap: scaleByDeviceWidth(12),
  },
  actionsBar: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(12),
    paddingBottom: scaleByDeviceWidth(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8DBC8',
    backgroundColor: '#FFF8ED',
  },
  actionButton: {
    width: scaleByDeviceWidth(154),
    height: scaleByDeviceWidth(60),
  },
  actionButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
});
