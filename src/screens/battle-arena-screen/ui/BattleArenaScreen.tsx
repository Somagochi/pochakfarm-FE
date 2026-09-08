import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  getBattleArenaType,
  isBattleCoachId,
  useGymLeaderDetail,
  type BattleArenaType,
  type BattleBroadcastEvent,
  type BattleCoachId,
  type BattleEntry,
  type BattleEntrySkill,
  type BattleState,
} from '@/src/entities/battle';
import type { CreatureEnvironment } from '@/src/entities/creature';
import { useSubmitBattleAction } from '@/src/features/select-battle-skill';
import { useResumeBattle } from '@/src/features/resume-battle';
import { useStartBattleFinalRound } from '@/src/features/start-battle-final-round';
import { useSubmitBattleFinalRound } from '@/src/features/submit-battle-final-round';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ARENA_BACKGROUNDS: Record<BattleArenaType, number> = {
  ground: require('@/src/shared/assets/images/battle/ground-arena-background.png'),
  sky: require('@/src/shared/assets/images/battle/sky-arena-background.png'),
  sea: require('@/src/shared/assets/images/battle/sea-arena-background.png'),
  space: require('@/src/shared/assets/images/battle/space-arena-background.png'),
};
const BATTLE_BROADCAST_DIALOG = require('@/src/shared/assets/images/battle/battle-broadcast-dialog.png');
const BATTLE_PROGRESS_BAR = require('@/src/shared/assets/images/battle/battle-progress-bar.png');
const BATTLE_PROGRESS_FILL = require('@/src/shared/assets/images/battle/battle-progress-fill.png');
const BATTLE_STATUS_BADGE = require('@/src/shared/assets/images/battle/battle-status-badge.png');
const BATTLE_ROUND_LABEL = require('@/src/shared/assets/images/battle/battle-round-label.png');
const OPPONENT_CREATURE = require('@/src/shared/assets/images/farm/kkomi.png');
const PLAYER_SILHOUETTE = require('@/src/shared/assets/images/battle/player-silhouette.png');
const OPPONENT_CREATURE_INFO_CARD = require('@/src/shared/assets/images/battle/opponent-creature-info-card.png');
const PLAYER_CREATURE_INFO_CARD = require('@/src/shared/assets/images/battle/player-creature-info-card.png');
const BALANCE_SKILL_TYPE = require('@/src/shared/assets/images/battle/info-card-skill-type-balance.png');
const COMPETITIVE_SKILL_TYPE = require('@/src/shared/assets/images/battle/info-card-skill-type-competitive.png');
const STABLE_SKILL_TYPE = require('@/src/shared/assets/images/battle/info-card-skill-type-stable.png');
const CHEER_BUTTON = require('@/src/shared/assets/images/battle/cheer-button.png');
const HOURGLASS = require('@/src/shared/assets/images/battle/hourglass.png');
const SKILL_SELECTION_DIVIDER = require('@/src/shared/assets/images/battle/skill-selection-divider.png');
const SKILL_SELECTION_CARD_BACKGROUND = require('@/src/shared/assets/images/battle/skill-selection-card-background-v2.png');
const RECOMMENDED_SKILL_BADGE = require('@/src/shared/assets/images/battle/recommended-skill-badge.png');
const SKILL_TYPE_OFFENSIVE = require('@/src/shared/assets/images/battle/skill-type-offensive.png');
const SKILL_TYPE_BALANCE = require('@/src/shared/assets/images/battle/skill-type-balance.png');
const SKILL_TYPE_STABLE = require('@/src/shared/assets/images/battle/skill-type-stable.png');
const BATTLE_PROGRESS_INNER_WIDTH = scaleByDeviceWidth(258.33);
const BATTLE_PROGRESS_FILL_WIDTH = scaleByDeviceWidth(258.33);
const BATTLE_PROGRESS_FILL_HEIGHT = scaleByDeviceWidth(21.62);
const BATTLE_PROGRESS_FILL_IMAGE_WIDTH =
  BATTLE_PROGRESS_FILL_WIDTH * (2020 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_HEIGHT =
  BATTLE_PROGRESS_FILL_HEIGHT * (778 / 144);
const BATTLE_PROGRESS_FILL_IMAGE_LEFT =
  -BATTLE_PROGRESS_FILL_WIDTH * (74 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_TOP =
  -BATTLE_PROGRESS_FILL_HEIGHT * (303 / 144);
const BATTLE_STATUS_BADGE_SIZE = scaleByDeviceWidth(51.67);
const SKILL_TIMER_TRACK_WIDTH = scaleByDeviceWidth(180);
const BROADCAST_TYPING_INTERVAL_MS = 35;
const BATTLE_ENTRANCE_DURATION_MS = 1000;
const SKILL_SELECTION_DURATION_MS = 3000;
const IS_BATTLE_ACTION_SUBMISSION_ENABLED = true;
const IS_SKILL_SELECTION_UI_PREVIEW_ENABLED = false;

const SKILL_TYPE_LABELS: Record<string, string> = {
  ATTACK: '공격형',
  AGGRESSIVE: '공격형',
  OFFENSIVE: '공격형',
  BALANCE: '균형형',
  COMPETITIVE: '승부형',
  GAMBLE: '승부형',
  STABLE: '안정형',
  공격형: '공격형',
  균형형: '균형형',
  승부형: '승부형',
  안정형: '안정형',
};
const TIER_RANKS: Record<string, number> = {
  C: 1,
  B: 2,
  A: 3,
  S: 4,
  SS: 5,
  SSS: 6,
};
const SKILL_TYPE_ICONS: Record<string, number> = {
  ATTACK: SKILL_TYPE_OFFENSIVE,
  AGGRESSIVE: SKILL_TYPE_OFFENSIVE,
  OFFENSIVE: SKILL_TYPE_OFFENSIVE,
  COMPETITIVE: SKILL_TYPE_OFFENSIVE,
  GAMBLE: SKILL_TYPE_OFFENSIVE,
  공격형: SKILL_TYPE_OFFENSIVE,
  승부형: SKILL_TYPE_OFFENSIVE,
  BALANCE: SKILL_TYPE_BALANCE,
  균형형: SKILL_TYPE_BALANCE,
  STABLE: SKILL_TYPE_STABLE,
  안정형: SKILL_TYPE_STABLE,
};

function getSkillTypeLabel(battleType: string) {
  return SKILL_TYPE_LABELS[battleType.trim().toUpperCase()] ?? '균형형';
}

function getSkillTypeIcon(battleType: string) {
  return SKILL_TYPE_ICONS[battleType.trim().toUpperCase()] ?? SKILL_TYPE_BALANCE;
}

type BattlePartyMember = {
  environment: CreatureEnvironment;
  id: string;
  imageUri?: string;
  name: string;
  orderNo?: number;
};

const TYPE_BADGES: Record<CreatureEnvironment, number> = {
  land: require('@/src/shared/assets/images/farm-search/land-badge.png'),
  sky: require('@/src/shared/assets/images/farm-search/sky-badge.png'),
  sea: require('@/src/shared/assets/images/farm-search/sea-badge.png'),
  space: require('@/src/shared/assets/images/farm-search/space-badge.png'),
};

const TIER_BADGES: Record<string, number> = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
};

const ENVIRONMENT_BY_CARD_TYPE = {
  GROUND: 'land',
  SKY: 'sky',
  SEA: 'sea',
  SPACE: 'space',
} as const;
const SKILL_TYPE_SOURCES: Record<string, number> = {
  BALANCE: BALANCE_SKILL_TYPE,
  COMPETITIVE: COMPETITIVE_SKILL_TYPE,
  GAMBLE: COMPETITIVE_SKILL_TYPE,
  STABLE: STABLE_SKILL_TYPE,
};

function parseParty(value?: string | string[]): BattlePartyMember[] {
  const serializedParty = Array.isArray(value) ? value[0] : value;

  if (!serializedParty) {
    return [];
  }

  try {
    const parsedParty: unknown = JSON.parse(serializedParty);

    if (!Array.isArray(parsedParty)) {
      return [];
    }

    return parsedParty.filter(
      (member): member is BattlePartyMember =>
        typeof member === 'object' &&
        member !== null &&
        'id' in member &&
        typeof member.id === 'string' &&
        'name' in member &&
        typeof member.name === 'string' &&
        'environment' in member &&
        ['land', 'sky', 'sea', 'space'].includes(String(member.environment)),
    );
  } catch {
    return [];
  }
}

function parseBattleState(value?: string | string[]) {
  const serializedState = Array.isArray(value) ? value[0] : value;

  if (!serializedState) {
    return null;
  }

  try {
    const state = JSON.parse(serializedState) as BattleState;

    if (
      typeof state !== 'object' ||
      state === null ||
      !Number.isSafeInteger(state.battleId) ||
      !Array.isArray(state.broadcastEvents)
    ) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

function getBattleProgress(state: BattleState) {
  const range = state.maxBarPosition - state.minBarPosition;

  if (range <= 0) {
    return 0.5;
  }

  return Math.max(
    0,
    Math.min(1, (state.barPosition - state.minBarPosition) / range),
  );
}

function getEventAnimalName(
  event: BattleBroadcastEvent,
  state: BattleState,
  userParty: BattlePartyMember[],
  npcParty: BattlePartyMember[],
) {
  const party = event.animalSide === 'NPC' ? npcParty : userParty;
  const partyMember = party.find(
    (member, index) => (member.orderNo ?? index + 1) === event.entryOrder,
  );

  if (partyMember) {
    return partyMember.name;
  }

  const entry = event.animalSide === 'NPC' ? state.npcEntry : state.userEntry;
  return entry.animalName;
}

function getEventMessage(
  event: BattleBroadcastEvent,
  state: BattleState,
  userParty: BattlePartyMember[],
  npcParty: BattlePartyMember[],
) {
  const animalName = getEventAnimalName(event, state, userParty, npcParty);

  switch (event.eventCode) {
    case 'TIER_ADVANTAGE':
      return `${animalName}의 티어가 더 높아요!`;
    case 'TYPE_ADVANTAGE':
      return `타입 상성은 ${animalName}에게 유리해요!`;
    case 'SKILL_NOT_SELECTED':
      return '스킬 사용에 실패했어요.';
    case 'SKILL_TRIGGERED':
      return `${animalName}의 「${event.skillName ?? '스킬'}」 스킬이 발동했어요!`;
    case 'SKILL_FAILED':
      return `${animalName}의 「${event.skillName ?? '스킬'}」 스킬이 발동하지 않았어요.`;
    case 'SKILL_OFFSET':
      return '양쪽 스킬 효과가 상쇄되었어요.';
    case 'BATTLE_POINT_APPLIED':
      return `${event.winnerSide === 'USER' ? '유저' : '관장'} 쪽에서 승부 바를 ${event.point ?? 0}포인트 밀어냈어요!`;
  }
}

type CreatureInfoCardProps = {
  entry: BattleEntry;
  isOpponent?: boolean;
  isSkillSelectionDisabled?: boolean;
  onSkillPress?: (skill: string) => void;
  selectedSkill?: string | null;
};

function CreatureInfoCard({
  entry,
  isOpponent = false,
  isSkillSelectionDisabled = false,
  onSkillPress,
  selectedSkill,
}: CreatureInfoCardProps) {
  const environment = ENVIRONMENT_BY_CARD_TYPE[entry.cardType];
  const visibleSkills = Array.isArray(entry.skills)
    ? entry.skills.slice(0, 2)
    : [];
  const hasSelectedSkill = selectedSkill != null;

  return (
    <ImageBackground
      accessibilityLabel={`${entry.animalName}, ${entry.tier} 티어, ${entry.cardType} 타입`}
      resizeMode="stretch"
      source={
        isOpponent
          ? OPPONENT_CREATURE_INFO_CARD
          : PLAYER_CREATURE_INFO_CARD
      }
      style={[
        styles.creatureInfoCard,
        isOpponent ? styles.opponentInfo : styles.playerInfo,
      ]}
    >
      <Image
        resizeMode="contain"
        source={TIER_BADGES[entry.tier.trim().toUpperCase()] ?? TIER_BADGES.C}
        style={[
          styles.tierBadge,
          isOpponent ? styles.opponentTierBadge : styles.playerTierBadge,
        ]}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.creatureName,
          isOpponent ? styles.opponentCreatureName : styles.playerCreatureName,
        ]}
      >
        {entry.animalName}
      </Text>
      <Image
        resizeMode="contain"
        source={TYPE_BADGES[environment]}
        style={[
          styles.typeBadge,
          isOpponent ? styles.opponentTypeBadge : styles.playerTypeBadge,
        ]}
      />
      {visibleSkills.map((skill, index) => (
        <Pressable
          accessibilityLabel={`${skill.name} 선택, 발동 확률 ${skill.triggerPercentage}%, ${skill.point}포인트`}
          accessibilityRole={isOpponent ? undefined : 'button'}
          accessibilityState={{
            disabled:
              isOpponent || isSkillSelectionDisabled || !onSkillPress,
            selected: hasSelectedSkill && selectedSkill === skill.skill,
          }}
          disabled={isOpponent || isSkillSelectionDisabled || !onSkillPress}
          key={`${entry.side}-${entry.captureId}-${entry.orderNo}-${skill.skill}-${index}`}
          onPress={() => onSkillPress?.(skill.skill)}
          style={({ pressed }) => [
            styles.skillRow,
            isOpponent
              ? styles.opponentSkillRow
              : styles.playerSkillRow,
            index === 0 ? styles.firstSkillRow : styles.secondSkillRow,
            hasSelectedSkill &&
              selectedSkill === skill.skill &&
              styles.selectedSkillRow,
            pressed && styles.pressedSkillRow,
          ]}
        >
          <Text numberOfLines={1} style={styles.skillName}>
            {skill.name}
          </Text>
          <Image
            resizeMode="contain"
            source={
              SKILL_TYPE_SOURCES[skill.battleType.trim().toUpperCase()] ??
              BALANCE_SKILL_TYPE
            }
            style={styles.skillType}
          />
        </Pressable>
      ))}
    </ImageBackground>
  );
}

export function BattleArenaScreen() {
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRequestedFinalRoundStartRef = useRef(false);
  const hasSubmittedFinalRoundResultRef = useRef(false);
  const hasHandledBattleEndRef = useRef(false);
  const finalTapCountRef = useRef(0);
  const selectionTimerActionSeqRef = useRef<number | null>(null);
  const submittedActionRef = useRef<{
    actionSeq: number;
    skill: string | null;
  } | null>(null);
  const pendingBattleStateRef = useRef<BattleState | null>(null);
  const hasPreparedInitialRoundLogRef = useRef(false);
  const syntheticBroadcastKeysRef = useRef(new Set<string>());
  const {
    clearError: clearBattleActionError,
    errorMessage: battleActionErrorMessage,
    isLoading: isSubmittingAction,
    submitBattleAction,
  } = useSubmitBattleAction();
  const {
    clearError: clearFinalRoundStartError,
    errorMessage: finalRoundStartErrorMessage,
    startBattleFinalRound,
  } = useStartBattleFinalRound();
  const {
    clearError: clearFinalRoundSubmitError,
    errorMessage: finalRoundSubmitErrorMessage,
    isLoading: isSubmittingFinalRound,
    submitBattleFinalRound,
  } = useSubmitBattleFinalRound();
  const {
    clearBattleSession,
    clearError: clearResumeBattleError,
    errorMessage: resumeBattleErrorMessage,
    isLoading: isResumingBattle,
    resumeBattle,
    saveLastPlayedEventSequence,
  } = useResumeBattle();
  const {
    battleId,
    coach,
    gymLeaderImageUrl,
    initialBattleState,
    npcParty,
    party,
  } =
    useLocalSearchParams<{
    battleId?: string | string[];
    coach?: string | string[];
    gymLeaderImageUrl?: string | string[];
    initialBattleState?: string | string[];
    npcParty?: string | string[];
    party?: string | string[];
  }>();
  const battleIdParam = Array.isArray(battleId) ? battleId[0] : battleId;
  const parsedBattleId = Number(battleIdParam);
  const routeBattleId =
    battleIdParam && Number.isSafeInteger(parsedBattleId) && parsedBattleId > 0
      ? parsedBattleId
      : undefined;
  const coachParam = Array.isArray(coach) ? coach[0] : coach;
  const routeCoachId =
    coachParam && isBattleCoachId(coachParam) ? coachParam : 'moru';
  const [restoredCoachId, setRestoredCoachId] =
    useState<BattleCoachId | null>(null);
  const coachId = restoredCoachId ?? routeCoachId;
  const routeCoachImageUrl = Array.isArray(gymLeaderImageUrl)
    ? gymLeaderImageUrl[0]
    : gymLeaderImageUrl;
  const [partyMembers, setPartyMembers] = useState(() => parseParty(party));
  const [npcPartyMembers, setNpcPartyMembers] = useState(() =>
    parseParty(npcParty),
  );
  const [battleState, setBattleState] = useState(() =>
    parseBattleState(initialBattleState),
  );
  const { gymLeaderDetail: arenaGymLeaderDetail } = useGymLeaderDetail(
    battleState?.gymLeaderId,
  );
  const leaderType =
    arenaGymLeaderDetail?.gymLeader.leaderType ??
    battleState?.npcEntry.cardType ??
    'GROUND';
  const arenaType = useMemo(
    () => getBattleArenaType(leaderType),
    [leaderType],
  );
  const coachImageUrl =
    arenaGymLeaderDetail?.gymLeader.imageUrl ?? routeCoachImageUrl;
  const [hasAttemptedBattleRestore, setHasAttemptedBattleRestore] =
    useState(false);
  const [isBattleEntranceReady, setIsBattleEntranceReady] = useState(false);
  const [isAppActive, setIsAppActive] = useState(
    () => AppState.currentState === 'active',
  );
  const isFocused = useIsFocused();
  const [finalTapCount, setFinalTapCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [skillSelectionDeadlineMs, setSkillSelectionDeadlineMs] = useState<
    number | null
  >(null);
  const [initialBroadcastEvents] = useState(
    () =>
      [...(battleState?.broadcastEvents ?? [])].sort(
        (firstEvent, secondEvent) =>
          firstEvent.eventSeq - secondEvent.eventSeq,
      ),
  );
  const knownEventSequencesRef = useRef(
    new Set(initialBroadcastEvents.map((event) => event.eventSeq)),
  );
  const playedEventSequencesRef = useRef(new Set<number>());
  const lastPlayedEventSequenceRef = useRef(0);
  const [broadcastQueue, setBroadcastQueue] = useState(
    initialBroadcastEvents,
  );
  const [activeBroadcastEvent, setActiveBroadcastEvent] =
    useState<BattleBroadcastEvent | null>(null);
  const [latestBroadcastEvent, setLatestBroadcastEvent] =
    useState<BattleBroadcastEvent | null>(null);
  const [typedBroadcastMessage, setTypedBroadcastMessage] = useState('');
  const [isTypingBroadcastMessage, setIsTypingBroadcastMessage] =
    useState(false);
  const initialProgress = battleState ? getBattleProgress(battleState) : 0.5;
  const battleProgress = useSharedValue(initialProgress);
  const finalClashProgress = useSharedValue(initialProgress);
  const player = battleState
    ? partyMembers.find(
        (member, index) =>
          (member.orderNo ?? index + 1) === battleState.userEntry.orderNo,
      )
    : undefined;
  const opponent = battleState
    ? npcPartyMembers.find(
        (member, index) =>
          (member.orderNo ?? index + 1) === battleState.npcEntry.orderNo,
      )
    : undefined;
  const latestBroadcastMessage = useMemo(
    () =>
      battleState && latestBroadcastEvent
        ? getEventMessage(
            latestBroadcastEvent,
            battleState,
            partyMembers,
            npcPartyMembers,
          )
        : '대전을 시작합니다!',
    [battleState, latestBroadcastEvent, npcPartyMembers, partyMembers],
  );
  const broadcastAnimalName = useMemo(
    () =>
      battleState && latestBroadcastEvent
        ? getEventAnimalName(
            latestBroadcastEvent,
            battleState,
            partyMembers,
            npcPartyMembers,
          )
        : null,
    [battleState, latestBroadcastEvent, npcPartyMembers, partyMembers],
  );
  const broadcastMessageParts = useMemo(() => {
    if (!broadcastAnimalName) {
      return [{ isAnimalName: false, text: typedBroadcastMessage }];
    }

    const nameStart = latestBroadcastMessage.indexOf(broadcastAnimalName);
    if (nameStart < 0) {
      return [{ isAnimalName: false, text: typedBroadcastMessage }];
    }

    const visibleLength = typedBroadcastMessage.length;
    const nameEnd = nameStart + broadcastAnimalName.length;

    return [
      {
        isAnimalName: false,
        text: typedBroadcastMessage.slice(0, Math.min(visibleLength, nameStart)),
      },
      {
        isAnimalName: true,
        text: typedBroadcastMessage.slice(
          nameStart,
          Math.min(visibleLength, nameEnd),
        ),
      },
      {
        isAnimalName: false,
        text: typedBroadcastMessage.slice(nameEnd),
      },
    ].filter((part) => part.text.length > 0);
  }, [broadcastAnimalName, latestBroadcastMessage, typedBroadcastMessage]);
  const latestBroadcastAnimal = useMemo(() => {
    if (!latestBroadcastEvent) {
      return null;
    }

    const eventSide =
      latestBroadcastEvent.animalSide ?? latestBroadcastEvent.winnerSide;

    if (!eventSide) {
      return null;
    }

    const eventParty = eventSide === 'NPC' ? npcPartyMembers : partyMembers;
    return eventParty.find(
      (member, index) =>
        (member.orderNo ?? index + 1) === latestBroadcastEvent.entryOrder,
    ) ?? null;
  }, [latestBroadcastEvent, npcPartyMembers, partyMembers]);
  const serverTimeOffsetMs = battleState?.serverTimeOffsetMs ?? 0;
  const currentServerTimeMs = nowMs + serverTimeOffsetMs;
  const isFinalClashVisible = Boolean(
    battleState?.status === 'IN_PROGRESS' &&
      battleState.finalRound.required &&
      battleState.finalRound.started,
  );
  const finalInputEndMs = battleState?.finalRound.inputExpiresAt
    ? Date.parse(battleState.finalRound.inputExpiresAt)
    : Number.NaN;
  const finalInputRemainingMs = Number.isFinite(finalInputEndMs)
    ? Math.max(0, finalInputEndMs - currentServerTimeMs)
    : 0;
  const isBroadcasting =
    activeBroadcastEvent !== null || broadcastQueue.length > 0;
  const isSkillSelectionReady = Boolean(
      battleState?.status === 'IN_PROGRESS' &&
      battleState.nextActionSeq !== null &&
      hasAttemptedBattleRestore &&
      isBattleEntranceReady &&
      isAppActive &&
      isFocused &&
      !isSubmittingAction &&
      !isResumingBattle &&
      !isBroadcasting,
  );
  const canSelectSkill = Boolean(
    isSkillSelectionReady &&
      skillSelectionDeadlineMs !== null &&
      skillSelectionDeadlineMs > nowMs,
  );
  const isSkillSelectionOverlayVisible =
    IS_SKILL_SELECTION_UI_PREVIEW_ENABLED || canSelectSkill;
  const selectableSkills = battleState?.userEntry.skills?.slice(0, 2) ?? [];
  const recommendedSkill = selectableSkills.reduce<BattleEntrySkill | null>(
    (recommended, skill) =>
      !recommended || skill.triggerPercentage > recommended.triggerPercentage
        ? skill
        : recommended,
    null,
  );
  const currentBattleId = routeBattleId ?? battleState?.battleId;
  const enqueueBroadcastEvents = useCallback(
    (events: BattleBroadcastEvent[]) => {
      const nextEvents = [...events]
        .sort(
          (firstEvent, secondEvent) =>
            firstEvent.eventSeq - secondEvent.eventSeq,
        )
        .filter(
          (event) =>
            event.eventSeq > lastPlayedEventSequenceRef.current &&
            !knownEventSequencesRef.current.has(event.eventSeq) &&
            !syntheticBroadcastKeysRef.current.has(
              `${event.actionSeq}:${event.entryOrder}:${event.eventCode}`,
            ),
        );

      if (nextEvents.length === 0) {
        return [];
      }

      nextEvents.forEach((event) => {
        knownEventSequencesRef.current.add(event.eventSeq);
      });
      setBroadcastQueue((currentQueue) =>
        [...currentQueue, ...nextEvents].sort(
          (firstEvent, secondEvent) =>
            firstEvent.eventSeq - secondEvent.eventSeq,
        ),
      );
      return nextEvents;
    },
    [],
  );
  const refreshBattleState = useCallback(async () => {
    setHasAttemptedBattleRestore(false);
    const resumedBattle = await resumeBattle(currentBattleId);
    setHasAttemptedBattleRestore(true);

    if (!resumedBattle) {
      return;
    }

    if (resumedBattle.session) {
      setRestoredCoachId(resumedBattle.session.coach);
      setPartyMembers(parseParty(resumedBattle.session.party));
      setNpcPartyMembers(parseParty(resumedBattle.session.npcParty));
    }

    const restoredLastPlayedEventSeq =
      resumedBattle.session?.lastPlayedEventSeq ?? 0;
    lastPlayedEventSequenceRef.current = Math.max(
      lastPlayedEventSequenceRef.current,
      restoredLastPlayedEventSeq,
    );
    setBroadcastQueue((currentQueue) =>
      currentQueue.filter(
        (event) => event.eventSeq > restoredLastPlayedEventSeq,
      ),
    );
    setActiveBroadcastEvent((currentEvent) =>
      currentEvent && currentEvent.eventSeq > restoredLastPlayedEventSeq
        ? currentEvent
        : null,
    );

    selectionTimerActionSeqRef.current = null;
    submittedActionRef.current = null;
    pendingBattleStateRef.current = null;
    hasRequestedFinalRoundStartRef.current =
      resumedBattle.state.finalRound.started;
    hasSubmittedFinalRoundResultRef.current = false;
    hasHandledBattleEndRef.current = false;
    setSkillSelectionDeadlineMs(null);
    enqueueBroadcastEvents(resumedBattle.state.broadcastEvents);
    setBattleState(resumedBattle.state);
  }, [currentBattleId, enqueueBroadcastEvents, resumeBattle]);
  const applyPendingBattleStateForEvent = useCallback(
    (event: BattleBroadcastEvent) => {
      const pendingState = pendingBattleStateRef.current;

      if (
        !pendingState ||
        event.entryOrder !== pendingState.currentEntryOrder ||
        event.entryOrder === battleState?.currentEntryOrder
      ) {
        return;
      }

      pendingBattleStateRef.current = null;
      setBattleState(pendingState);
    },
    [battleState?.currentEntryOrder],
  );
  const handleSubmitAction = useCallback(
    async (skill: string | null, isRetry = false) => {
      if (!IS_BATTLE_ACTION_SUBMISSION_ENABLED) {
        return;
      }

      if (
        !battleState ||
        battleState.status !== 'IN_PROGRESS' ||
        battleState.nextActionSeq === null
      ) {
        return;
      }

      const actionSeq = battleState.nextActionSeq;

      if (
        !Number.isSafeInteger(actionSeq) ||
        actionSeq < 1 ||
        actionSeq > 9
      ) {
        Alert.alert(
          '행동 순서 오류',
          '서버에서 올바르지 않은 행동 순서를 받았습니다.',
        );
        return;
      }

      const submittedAction = submittedActionRef.current;

      if (
        !isRetry &&
        submittedAction?.actionSeq === actionSeq
      ) {
        return;
      }

      const requestedSkill =
        isRetry && submittedAction?.actionSeq === actionSeq
          ? submittedAction.skill
          : skill;
      const selectedSkill =
        !isRetry &&
        requestedSkill !== null &&
        skillSelectionDeadlineMs !== null &&
        Date.now() >= skillSelectionDeadlineMs
          ? null
          : requestedSkill;
      submittedActionRef.current = { actionSeq, skill: selectedSkill };
      setSkillSelectionDeadlineMs(null);
      const result = await submitBattleAction({
        actionSeq,
        battleId: battleState.battleId,
        skill: selectedSkill,
      });

      if (!result) {
        return;
      }

      const enqueuedActionEvents = result.action
        ? enqueueBroadcastEvents(result.action.broadcastEvents)
        : [];
      const enqueuedStateEvents = enqueueBroadcastEvents(
        result.state.broadcastEvents,
      );
      const enqueuedEvents = [
        ...enqueuedActionEvents,
        ...enqueuedStateEvents,
      ].sort(
        (firstEvent, secondEvent) =>
          firstEvent.eventSeq - secondEvent.eventSeq,
      );

      if (
        !result.action &&
        result.state.nextActionSeq === actionSeq
      ) {
        submittedActionRef.current = null;
      }

      if (enqueuedEvents.length > 0) {
        pendingBattleStateRef.current = result.state;
        const [firstEvent] = enqueuedEvents;
        applyPendingBattleStateForEvent(firstEvent);
        setBroadcastQueue((currentQueue) =>
          currentQueue.filter(
            (event) => event.eventSeq !== firstEvent.eventSeq,
          ),
        );
        setActiveBroadcastEvent(firstEvent);
      } else {
        setBattleState(result.state);
      }
    },
    [
      battleState,
      applyPendingBattleStateForEvent,
      enqueueBroadcastEvents,
      skillSelectionDeadlineMs,
      submitBattleAction,
    ],
  );
  const handleStartFinalRound = useCallback(
    async (isRetry = false) => {
      if (
        !battleState ||
        battleState.status !== 'IN_PROGRESS' ||
        !battleState.finalRound.required ||
        battleState.finalRound.started ||
        (hasRequestedFinalRoundStartRef.current && !isRetry)
      ) {
        return;
      }

      hasRequestedFinalRoundStartRef.current = true;
      const result = await startBattleFinalRound(battleState.battleId);

      if (!result) {
        return;
      }

      setNowMs(Date.now());
      setBattleState((currentState) =>
        currentState
          ? {
              ...currentState,
              status: result.battleStatus,
              result: result.battleResult,
              finalRound: result.finalRound,
              reward: result.reward,
              serverTimeOffsetMs: result.serverTimeOffsetMs,
            }
          : currentState,
      );
    },
    [battleState, startBattleFinalRound],
  );
  const handleSubmitFinalRound = useCallback(
    async (isRetry = false) => {
      if (
        !battleState ||
        !battleState.finalRound.required ||
        !battleState.finalRound.started ||
        (hasSubmittedFinalRoundResultRef.current && !isRetry)
      ) {
        return;
      }

      hasSubmittedFinalRoundResultRef.current = true;
      const result = await submitBattleFinalRound({
        battleId: battleState.battleId,
        serverTimeOffsetMs: battleState.serverTimeOffsetMs,
        submissionExpiresAt:
          battleState.finalRound.submissionExpiresAt,
        tapCount: finalTapCountRef.current,
      });

      if (!result) {
        return;
      }

      await clearBattleSession();
      router.replace({
        pathname: '/battle-result',
        params: {
          battleId: String(result.battleId),
          battleResult: result.battleResult ?? undefined,
          coach: coachId,
          finalRoundResult: JSON.stringify(result),
          gymLeaderId: String(battleState.gymLeaderId),
          npcParty: JSON.stringify(npcPartyMembers),
          party: JSON.stringify(partyMembers),
          reward: result.reward ? JSON.stringify(result.reward) : undefined,
        },
      });
    },
    [
      battleState,
      clearBattleSession,
      coachId,
      npcPartyMembers,
      partyMembers,
      submitBattleFinalRound,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      setIsBattleEntranceReady(false);
      void refreshBattleState();

      return () => {
        selectionTimerActionSeqRef.current = null;
        setSkillSelectionDeadlineMs(null);
      };
    }, [refreshBattleState]),
  );

  useEffect(() => {
    if (!hasAttemptedBattleRestore || isBattleEntranceReady) {
      return;
    }

    const timeoutId = setTimeout(
      () => setIsBattleEntranceReady(true),
      BATTLE_ENTRANCE_DURATION_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [hasAttemptedBattleRestore, isBattleEntranceReady]);

  useEffect(() => {
    if (
      !hasAttemptedBattleRestore ||
      !battleState ||
      hasPreparedInitialRoundLogRef.current
    ) {
      return;
    }

    hasPreparedInitialRoundLogRef.current = true;

    if (activeBroadcastEvent || broadcastQueue.length > 0) {
      return;
    }

    const userTierRank =
      TIER_RANKS[battleState.userEntry.tier.toUpperCase()] ?? 0;
    const npcTierRank =
      TIER_RANKS[battleState.npcEntry.tier.toUpperCase()] ?? 0;

    if (userTierRank === npcTierRank || battleState.nextActionSeq === null) {
      return;
    }

    const advantageSide = userTierRank > npcTierRank ? 'USER' : 'NPC';
    const initialTierEvent: BattleBroadcastEvent = {
      actionSeq: battleState.nextActionSeq,
      animalSide: advantageSide,
      entryOrder: battleState.currentEntryOrder,
      eventCode: 'TIER_ADVANTAGE',
      eventSeq: -2,
    };
    const initialBattlePointEvent: BattleBroadcastEvent = {
      actionSeq: battleState.nextActionSeq,
      entryOrder: battleState.currentEntryOrder,
      eventCode: 'BATTLE_POINT_APPLIED',
      eventSeq: -1,
      point: 1,
      winnerSide: advantageSide,
    };
    [initialTierEvent, initialBattlePointEvent].forEach((event) => {
      syntheticBroadcastKeysRef.current.add(
        `${event.actionSeq}:${event.entryOrder}:${event.eventCode}`,
      );
    });
    setBroadcastQueue([initialTierEvent, initialBattlePointEvent]);
  }, [
    activeBroadcastEvent,
    battleState,
    broadcastQueue.length,
    hasAttemptedBattleRestore,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isActive = nextState === 'active';
      setIsAppActive(isActive);

      if (!isActive) {
        selectionTimerActionSeqRef.current = null;
        setSkillSelectionDeadlineMs(null);
        return;
      }

      if (isFocused) {
        void refreshBattleState();
      }
    });

    return () => subscription.remove();
  }, [isFocused, refreshBattleState]);

  useEffect(() => {
    if (!resumeBattleErrorMessage) {
      return;
    }

    clearResumeBattleError();
    Alert.alert('대전 복구 실패', resumeBattleErrorMessage);
  }, [clearResumeBattleError, resumeBattleErrorMessage]);

  useEffect(() => {
    if (!battleActionErrorMessage) {
      return;
    }

    clearBattleActionError();
    Alert.alert('행동 처리 실패', battleActionErrorMessage, [
      { text: '취소', style: 'cancel' },
      {
        text: '다시 시도',
        onPress: () =>
          void handleSubmitAction(
            submittedActionRef.current?.skill ?? null,
            true,
          ),
      },
    ]);
  }, [
    battleActionErrorMessage,
    clearBattleActionError,
    handleSubmitAction,
  ]);

  useEffect(() => {
    if (!finalRoundStartErrorMessage) {
      return;
    }

    clearFinalRoundStartError();
    Alert.alert('최종 승부 시작 실패', finalRoundStartErrorMessage, [
      { text: '취소', style: 'cancel' },
      {
        text: '다시 시도',
        onPress: () => void handleStartFinalRound(true),
      },
    ]);
  }, [
    clearFinalRoundStartError,
    finalRoundStartErrorMessage,
    handleStartFinalRound,
  ]);

  useEffect(() => {
    if (!finalRoundSubmitErrorMessage) {
      return;
    }

    clearFinalRoundSubmitError();
    Alert.alert('최종 승부 결과 제출 실패', finalRoundSubmitErrorMessage, [
      {
        text: '다시 시도',
        onPress: () => void handleSubmitFinalRound(true),
      },
    ], { cancelable: false });
  }, [
    clearFinalRoundSubmitError,
    finalRoundSubmitErrorMessage,
    handleSubmitFinalRound,
  ]);

  useEffect(() => {
    if (
      !hasAttemptedBattleRestore ||
      activeBroadcastEvent ||
      broadcastQueue.length === 0 ||
      latestBroadcastEvent !== null
    ) {
      return;
    }

    const [nextEvent, ...remainingEvents] = broadcastQueue;
    if (nextEvent) {
      applyPendingBattleStateForEvent(nextEvent);
    }
    setBroadcastQueue(remainingEvents);
    setActiveBroadcastEvent(nextEvent ?? null);
  }, [
    activeBroadcastEvent,
    applyPendingBattleStateForEvent,
    broadcastQueue,
    hasAttemptedBattleRestore,
    latestBroadcastEvent,
  ]);

  useEffect(() => {
    if (!activeBroadcastEvent) {
      return;
    }

    if (!playedEventSequencesRef.current.has(activeBroadcastEvent.eventSeq)) {
      playedEventSequencesRef.current.add(activeBroadcastEvent.eventSeq);
      lastPlayedEventSequenceRef.current = activeBroadcastEvent.eventSeq;
      setLatestBroadcastEvent(activeBroadcastEvent);
      if (currentBattleId && activeBroadcastEvent.eventSeq > 0) {
        saveLastPlayedEventSequence(
          currentBattleId,
          activeBroadcastEvent.eventSeq,
        );
      }
    }
  }, [activeBroadcastEvent, currentBattleId, saveLastPlayedEventSequence]);

  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setTypedBroadcastMessage('');
    setIsTypingBroadcastMessage(true);
    let visibleCharacterCount = 0;
    typingIntervalRef.current = setInterval(() => {
      visibleCharacterCount += 1;
      setTypedBroadcastMessage(
        latestBroadcastMessage.slice(0, visibleCharacterCount),
      );

      if (visibleCharacterCount >= latestBroadcastMessage.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTypingBroadcastMessage(false);
      }
    }, BROADCAST_TYPING_INTERVAL_MS);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [latestBroadcastMessage]);

  const handleBroadcastDialogPress = () => {
    if (isTypingBroadcastMessage) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setTypedBroadcastMessage(latestBroadcastMessage);
      setIsTypingBroadcastMessage(false);
      return;
    }

    const [nextEvent, ...remainingEvents] = broadcastQueue;

    if (!nextEvent) {
      setActiveBroadcastEvent(null);
      return;
    }

    applyPendingBattleStateForEvent(nextEvent);
    setBroadcastQueue(remainingEvents);
    setActiveBroadcastEvent(nextEvent);
  };

  useEffect(() => {
    if (isBroadcasting || !pendingBattleStateRef.current) {
      return;
    }

    const nextState = pendingBattleStateRef.current;
    pendingBattleStateRef.current = null;
    setBattleState(nextState);
  }, [isBroadcasting]);

  useEffect(() => {
    if (!battleState) {
      return;
    }

    battleProgress.value = withTiming(getBattleProgress(battleState), {
      duration: 650,
    });
  }, [battleProgress, battleState]);

  useLayoutEffect(() => {
    const actionSeq = battleState?.nextActionSeq;

    if (
      !isSkillSelectionReady ||
      actionSeq === null ||
      actionSeq === undefined ||
      selectionTimerActionSeqRef.current === actionSeq
    ) {
      return;
    }

    const selectionStartedAt = Date.now();
    selectionTimerActionSeqRef.current = actionSeq;
    setNowMs(selectionStartedAt);
    setSkillSelectionDeadlineMs(
      selectionStartedAt + SKILL_SELECTION_DURATION_MS,
    );
  }, [battleState?.nextActionSeq, isSkillSelectionReady]);

  useEffect(() => {
    if (skillSelectionDeadlineMs === null) {
      return;
    }

    setNowMs(Date.now());
    const intervalId = setInterval(() => {
      const currentTimeMs = Date.now();
      setNowMs(currentTimeMs);

      if (currentTimeMs >= skillSelectionDeadlineMs) {
        clearInterval(intervalId);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [skillSelectionDeadlineMs]);

  useEffect(() => {
    if (
      !battleState ||
      battleState.status !== 'IN_PROGRESS' ||
      battleState.nextActionSeq === null ||
      skillSelectionDeadlineMs === null
    ) {
      return;
    }

    const actionSeq = battleState.nextActionSeq;
    const submitTimeoutAction = () => {
      if (submittedActionRef.current?.actionSeq !== actionSeq) {
        void handleSubmitAction(null);
      }
    };
    const remainingMs =
      skillSelectionDeadlineMs - Date.now();

    if (remainingMs <= 0) {
      submitTimeoutAction();
      return;
    }

    const timeoutId = setTimeout(submitTimeoutAction, remainingMs);
    return () => clearTimeout(timeoutId);
  }, [
    battleState,
    handleSubmitAction,
    skillSelectionDeadlineMs,
  ]);

  useEffect(() => {
    if (
      battleState?.status === 'IN_PROGRESS' &&
      battleState.finalRound.required &&
      !battleState.finalRound.started &&
      !isBroadcasting
    ) {
      void handleStartFinalRound();
    }
  }, [battleState, handleStartFinalRound, isBroadcasting]);

  useEffect(() => {
    if (
      !isFinalClashVisible ||
      !Number.isFinite(finalInputEndMs) ||
      finalInputEndMs <= Date.now() + serverTimeOffsetMs
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      const currentTimeMs = Date.now();
      setNowMs(currentTimeMs);

      if (currentTimeMs + serverTimeOffsetMs >= finalInputEndMs) {
        clearInterval(intervalId);
      }
    }, 50);
    return () => clearInterval(intervalId);
  }, [finalInputEndMs, isFinalClashVisible, serverTimeOffsetMs]);

  useEffect(() => {
    if (
      !isFinalClashVisible ||
      !Number.isFinite(finalInputEndMs)
    ) {
      return;
    }

    const submitResult = () => void handleSubmitFinalRound();
    const remainingInputMs =
      finalInputEndMs - (Date.now() + serverTimeOffsetMs);

    if (remainingInputMs <= 0) {
      submitResult();
      return;
    }

    const timeoutId = setTimeout(submitResult, remainingInputMs);
    return () => clearTimeout(timeoutId);
  }, [
    finalInputEndMs,
    handleSubmitFinalRound,
    isFinalClashVisible,
    serverTimeOffsetMs,
  ]);

  useEffect(() => {
    if (
      !battleState ||
      battleState.status === 'IN_PROGRESS' ||
      isBroadcasting ||
      hasHandledBattleEndRef.current
    ) {
      return;
    }

    hasHandledBattleEndRef.current = true;
    void clearBattleSession().then(() => {
      if (battleState.status === 'ABANDONED') {
        router.back();
        return;
      }

      router.replace({
        pathname: '/battle-result',
        params: {
          battleId: String(battleState.battleId),
          battleResult: battleState.result ?? undefined,
          coach: coachId,
          gymLeaderId: String(battleState.gymLeaderId),
          npcParty: JSON.stringify(npcPartyMembers),
          party: JSON.stringify(partyMembers),
          reward: battleState.reward
            ? JSON.stringify(battleState.reward)
            : undefined,
        },
      });
    });
  }, [
    battleState,
    clearBattleSession,
    coachId,
    isBroadcasting,
    npcPartyMembers,
    partyMembers,
  ]);

  const battleProgressStyle = useAnimatedStyle(() => ({
    width: BATTLE_PROGRESS_FILL_WIDTH * battleProgress.value,
  }));
  const battleStatusBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          BATTLE_PROGRESS_INNER_WIDTH * battleProgress.value -
          BATTLE_STATUS_BADGE_SIZE / 2,
      },
    ],
  }));
  const finalClashProgressStyle = useAnimatedStyle(() => ({
    width: BATTLE_PROGRESS_FILL_WIDTH * finalClashProgress.value,
  }));
  const finalClashStatusBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          BATTLE_PROGRESS_INNER_WIDTH * finalClashProgress.value -
          BATTLE_STATUS_BADGE_SIZE / 2,
      },
    ],
  }));
  const skillTimerProgress = useSharedValue(1);
  const skillTimerFillStyle = useAnimatedStyle(() => ({
    width: SKILL_TIMER_TRACK_WIDTH * skillTimerProgress.value,
  }));

  useEffect(() => {
    cancelAnimation(skillTimerProgress);

    if (IS_SKILL_SELECTION_UI_PREVIEW_ENABLED) {
      skillTimerProgress.value = 1;
      skillTimerProgress.value = withRepeat(
        withTiming(0, {
          duration: SKILL_SELECTION_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
      return () => cancelAnimation(skillTimerProgress);
    }

    if (skillSelectionDeadlineMs === null) {
      skillTimerProgress.value = 0;
      return;
    }

    const remainingMs = Math.max(0, skillSelectionDeadlineMs - Date.now());
    skillTimerProgress.value = Math.min(
      1,
      remainingMs / SKILL_SELECTION_DURATION_MS,
    );
    skillTimerProgress.value = withTiming(0, {
      duration: remainingMs,
      easing: Easing.linear,
    });

    return () => cancelAnimation(skillTimerProgress);
  }, [skillSelectionDeadlineMs, skillTimerProgress]);

  useEffect(() => {
    if (!isFinalClashVisible) {
      return;
    }

    finalClashProgress.value = battleProgress.value;
  }, [battleProgress, finalClashProgress, isFinalClashVisible]);

  const handleCheerPress = () => {
    if (Date.now() + serverTimeOffsetMs >= finalInputEndMs) {
      setNowMs(Date.now());
      return;
    }

    finalTapCountRef.current += 1;
    setFinalTapCount(finalTapCountRef.current);
    finalClashProgress.value = withTiming(
      Math.min(0.92, finalClashProgress.value + 0.035),
      { duration: 100 },
    );
  };

  if (!battleState) {
    return (
      <View style={styles.stateError}>
        <Text style={styles.stateErrorText}>
          {isResumingBattle || !hasAttemptedBattleRestore
            ? '대전 상태를 불러오는 중...'
            : '대전 상태를 불러오지 못했습니다.'}
        </Text>
        {!isResumingBattle && hasAttemptedBattleRestore && (
          <Pressable
            onPress={() => void refreshBattleState()}
            style={styles.stateErrorButton}
          >
            <Text style={styles.stateErrorButtonText}>다시 시도</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ImageBackground
      accessibilityLabel={`${arenaType} 타입 대전 경기장`}
      resizeMode="cover"
      source={ARENA_BACKGROUNDS[arenaType]}
      style={styles.screen}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <ImageBackground
            resizeMode="stretch"
            source={BATTLE_ROUND_LABEL}
            style={styles.roundLabel}
          >
            <Text style={styles.roundText}>
              {battleState.currentEntryOrder}라운드
            </Text>
          </ImageBackground>

          <View accessibilityLabel="결투 진행도" style={styles.statusBar}>
            <Image
              resizeMode="stretch"
              source={BATTLE_PROGRESS_BAR}
              style={styles.battleProgressFrame}
            />
            <Animated.View style={[styles.battleProgressFill, battleProgressStyle]}>
              <Image
                resizeMode="stretch"
                source={BATTLE_PROGRESS_FILL}
                style={styles.battleProgressFillImage}
              />
            </Animated.View>
            <Animated.Image
              resizeMode="contain"
              source={BATTLE_STATUS_BADGE}
              style={[styles.battleStatusBadge, battleStatusBadgeStyle]}
            />
          </View>

          <View style={styles.battleField}>
            <CreatureInfoCard
              entry={battleState.npcEntry}
              isOpponent
            />
            <Image
              resizeMode="contain"
              source={
                opponent?.imageUri
                  ? { uri: opponent.imageUri }
                  : OPPONENT_CREATURE
              }
              style={styles.opponentCreature}
            />
            {coachImageUrl && (
              <Image
                resizeMode="contain"
                source={{ uri: coachImageUrl }}
                style={styles.coach}
              />
            )}
            <Image
              resizeMode="contain"
              source={PLAYER_SILHOUETTE}
              style={styles.playerSilhouette}
            />
            <Image
              resizeMode="contain"
              source={
                player?.imageUri ? { uri: player.imageUri } : OPPONENT_CREATURE
              }
              style={styles.playerCreature}
            />
            <CreatureInfoCard
              entry={battleState.userEntry}
            />
          </View>

          <Pressable
            accessibilityHint="다음 중계 로그를 표시합니다."
            accessibilityLabel="대전 중계창"
            accessibilityRole="button"
            onPress={handleBroadcastDialogPress}
            style={styles.broadcastDialog}
          >
            <ImageBackground
              resizeMode="contain"
              source={BATTLE_BROADCAST_DIALOG}
              style={styles.broadcastDialogBackground}
            >
              <Text style={styles.broadcastMessage}>
                {broadcastMessageParts.map((part, index) => (
                  <Text
                    key={`${part.isAnimalName ? 'animal' : 'message'}-${index}`}
                    style={
                      part.isAnimalName
                        ? styles.broadcastAnimalName
                        : undefined
                    }
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
              {latestBroadcastAnimal?.imageUri && (
                <Image
                  resizeMode="contain"
                  source={{ uri: latestBroadcastAnimal.imageUri }}
                  style={styles.broadcastAnimal}
                />
              )}
            </ImageBackground>
          </Pressable>
        </View>
      </SafeAreaView>
      {isFinalClashVisible && (
        <View style={styles.finalClashOverlay}>
          <View style={styles.finalClashContent}>
            <Text style={styles.finalClashTitle}>마지막 승부!</Text>
            <Text style={styles.finalClashDescription}>
              버튼을 연타해서 승부를 결판지어보세요!
            </Text>
            <Text style={styles.finalClashTimer}>
              {isSubmittingFinalRound
                ? '결과 전송 중'
                : `${(finalInputRemainingMs / 1000).toFixed(1)}초 · ${finalTapCount}회`}
            </Text>
            <View accessibilityLabel="마지막 승부 진행도" style={styles.finalClashProgressBar}>
              <Image
                resizeMode="stretch"
                source={BATTLE_PROGRESS_BAR}
                style={styles.battleProgressFrame}
              />
              <Animated.View style={[styles.battleProgressFill, finalClashProgressStyle]}>
                <Image
                  resizeMode="stretch"
                  source={BATTLE_PROGRESS_FILL}
                  style={styles.battleProgressFillImage}
                />
              </Animated.View>
              <Animated.Image
                resizeMode="contain"
                source={BATTLE_STATUS_BADGE}
                style={[styles.battleStatusBadge, finalClashStatusBadgeStyle]}
              />
            </View>
            <Pressable
              accessibilityLabel="응원하기"
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  finalInputRemainingMs <= 0 || isSubmittingFinalRound,
              }}
              disabled={finalInputRemainingMs <= 0 || isSubmittingFinalRound}
              onPress={handleCheerPress}
              style={({ pressed }) => [
                styles.cheerButton,
                pressed && styles.cheerButtonPressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={CHEER_BUTTON}
                style={styles.cheerButtonImage}
              />
            </Pressable>
            <Text style={styles.cheerButtonLabel}>응원하기</Text>
          </View>
        </View>
      )}
      <View
        accessibilityElementsHidden={!isSkillSelectionOverlayVisible}
        importantForAccessibility={
          isSkillSelectionOverlayVisible ? 'yes' : 'no-hide-descendants'
        }
        pointerEvents={isSkillSelectionOverlayVisible ? 'auto' : 'none'}
        style={[
          styles.skillSelectionOverlay,
          !isSkillSelectionOverlayVisible && styles.hiddenSkillSelectionOverlay,
        ]}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={styles.skillSelectionModal}
        >
            <Text style={styles.skillSelectionOverlayTitle}>
              스킬을 선택해주세요
            </Text>
            <Text style={styles.skillSelectionOverlayDescription}>
              시간 내 선택하지 못할 시 스킬 발동에 실패합니다
            </Text>

            <View style={styles.skillTimer}>
              <Image source={HOURGLASS} style={styles.skillTimerIcon} />
              <Text style={styles.skillTimerLabel}>남은 시간</Text>
              <View style={styles.skillTimerTrack}>
                <Animated.View
                  style={[styles.skillTimerFill, skillTimerFillStyle]}
                />
              </View>
            </View>

            <Image
              resizeMode="contain"
              source={SKILL_SELECTION_DIVIDER}
              style={styles.skillSelectionDivider}
            />

            <View style={styles.skillCards}>
              {selectableSkills.map((skill) => {
                const isRecommended = recommendedSkill?.skill === skill.skill;
                return (
                  <Pressable
                    accessibilityLabel={`${skill.name}, ${getSkillTypeLabel(skill.battleType)}, 발동 확률 ${skill.triggerPercentage}%, 성공 시 ${skill.point}포인트`}
                    accessibilityRole="button"
                    key={skill.skill}
                    onPress={() => {
                      void handleSubmitAction(skill.skill);
                    }}
                    style={({ pressed }) => [
                      styles.skillCard,
                      pressed && styles.pressedSkillCard,
                    ]}
                  >
                    <Image
                      resizeMode="stretch"
                      source={SKILL_SELECTION_CARD_BACKGROUND}
                      style={styles.skillCardBackground}
                    />
                    {isRecommended && (
                      <Image
                        resizeMode="contain"
                        source={RECOMMENDED_SKILL_BADGE}
                        style={styles.recommendedSkillBadge}
                      />
                    )}
                    <Text numberOfLines={1} style={styles.skillCardName}>
                      {skill.name}
                    </Text>
                    <View style={styles.skillCardStats}>
                      <View style={styles.skillCardStat}>
                        <View style={styles.skillTypeValue}>
                          <Image
                            resizeMode="contain"
                            source={getSkillTypeIcon(skill.battleType)}
                            style={styles.skillTypeIcon}
                          />
                          <Text style={styles.skillCardStatValue}>
                            {getSkillTypeLabel(skill.battleType)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.skillCardStat,
                          styles.trailingSkillCardStat,
                        ]}
                      >
                        <Text style={styles.skillCardStatValue}>
                          {skill.triggerPercentage}%
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.skillCardStat,
                          styles.trailingSkillCardStat,
                        ]}
                      >
                        <Text style={styles.skillCardStatValue}>
                          +{skill.point}P
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {isSubmittingAction && (
              <Text style={styles.skillSelectionStatus}>행동 처리 중...</Text>
            )}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  stateError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleByDeviceWidth(12),
    backgroundColor: '#FAF5EB',
  },
  stateErrorText: {
    color: '#675744',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
  },
  stateErrorButton: {
    paddingHorizontal: scaleByDeviceWidth(16),
    paddingVertical: scaleByDeviceWidth(8),
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: '#E8D5B4',
  },
  stateErrorButtonText: {
    color: '#675744',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  roundLabel: {
    position: 'absolute',
    top: scaleByDeviceWidth(20),
    width: scaleByDeviceWidth(125.31),
    height: scaleByDeviceWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  roundText: {
    color: '#3E352B',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(18),
  },
  battleField: {
    position: 'absolute',
    top: scaleByDeviceWidth(160),
    width: '100%',
    height: scaleByDeviceWidth(392),
  },
  creatureInfoCard: {
    position: 'absolute',
    width: scaleByDeviceWidth(192),
    height: scaleByDeviceWidth(73),
  },
  opponentInfo: {
    top: scaleByDeviceWidth(28),
    left: scaleByDeviceWidth(16),
  },
  playerInfo: {
    right: scaleByDeviceWidth(8),
    bottom: scaleByDeviceWidth(82),
  },
  creatureName: {
    position: 'absolute',
    top: scaleByDeviceWidth(11),
    color: '#655742',
    fontFamily: 'Pretendard-ExtraBold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(19),
  },
  opponentCreatureName: {
    left: scaleByDeviceWidth(55),
    right: scaleByDeviceWidth(39),
  },
  playerCreatureName: {
    left: scaleByDeviceWidth(48),
    right: scaleByDeviceWidth(46),
  },
  tierBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(19),
    height: scaleByDeviceWidth(20),
  },
  opponentTierBadge: {
    left: scaleByDeviceWidth(31),
  },
  playerTierBadge: {
    left: scaleByDeviceWidth(24),
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    width: scaleByDeviceWidth(17),
    height: scaleByDeviceWidth(26),
  },
  opponentTypeBadge: {
    right: scaleByDeviceWidth(22),
  },
  playerTypeBadge: {
    right: scaleByDeviceWidth(36),
  },
  skillRow: {
    position: 'absolute',
    height: scaleByDeviceWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opponentSkillRow: {
    left: scaleByDeviceWidth(22),
    right: scaleByDeviceWidth(59),
  },
  playerSkillRow: {
    left: scaleByDeviceWidth(58),
    right: scaleByDeviceWidth(21),
  },
  selectedSkillRow: {
    borderRadius: scaleByDeviceWidth(5),
    backgroundColor: 'rgba(255, 211, 78, 0.32)',
  },
  pressedSkillRow: {
    opacity: 0.7,
  },
  firstSkillRow: {
    top: scaleByDeviceWidth(39),
  },
  secondSkillRow: {
    top: scaleByDeviceWidth(53),
  },
  skillName: {
    flex: 1,
    marginRight: scaleByDeviceWidth(4),
    color: '#655742',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(9),
    lineHeight: scaleByDeviceWidth(12),
  },
  skillType: {
    flexShrink: 0,
    width: scaleByDeviceWidth(37),
    height: scaleByDeviceWidth(14),
  },
  opponentCreature: {
    position: 'absolute',
    top: scaleByDeviceWidth(112),
    left: scaleByDeviceWidth(148),
    width: scaleByDeviceWidth(92),
    height: scaleByDeviceWidth(92),
  },
  coach: {
    position: 'absolute',
    top: scaleByDeviceWidth(54),
    left: scaleByDeviceWidth(206),
    width: scaleByDeviceWidth(150),
    height: scaleByDeviceWidth(150),
  },
  playerSilhouette: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    bottom: scaleByDeviceWidth(25),
    width: scaleByDeviceWidth(121.62),
    height: scaleByDeviceWidth(150),
  },
  playerCreature: {
    position: 'absolute',
    left: scaleByDeviceWidth(96),
    bottom: scaleByDeviceWidth(25),
    width: scaleByDeviceWidth(92),
    height: scaleByDeviceWidth(92),
  },
  statusBar: {
    position: 'absolute',
    top: scaleByDeviceWidth(64),
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(44.9),
    zIndex: 2,
  },
  skillSelectionStatus: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  battleProgressFill: {
    position: 'absolute',
    top: '50%',
    left: scaleByDeviceWidth(10.83),
    height: BATTLE_PROGRESS_FILL_HEIGHT,
    overflow: 'hidden',
    transform: [
      {
        translateY:
          -BATTLE_PROGRESS_FILL_HEIGHT / 2 - scaleByDeviceWidth(1),
      },
    ],
  },
  battleProgressFillImage: {
    position: 'absolute',
    top: BATTLE_PROGRESS_FILL_IMAGE_TOP,
    left: BATTLE_PROGRESS_FILL_IMAGE_LEFT,
    width: BATTLE_PROGRESS_FILL_IMAGE_WIDTH,
    height: BATTLE_PROGRESS_FILL_IMAGE_HEIGHT,
  },
  battleProgressFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  battleStatusBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(-3.33),
    left: scaleByDeviceWidth(10.83),
    width: BATTLE_STATUS_BADGE_SIZE,
    height: BATTLE_STATUS_BADGE_SIZE,
  },
  skillSelectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 13, 20, 0.82)',
    zIndex: 9,
  },
  hiddenSkillSelectionOverlay: {
    opacity: 0,
  },
  skillSelectionModal: {
    flex: 1,
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(128),
  },
  skillSelectionOverlayTitle: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  skillSelectionOverlayDescription: {
    marginTop: scaleByDeviceWidth(8),
    color: '#C8C6BE',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  skillTimer: {
    width: scaleByDeviceWidth(272),
    height: scaleByDeviceWidth(28),
    marginTop: scaleByDeviceWidth(27),
    paddingHorizontal: scaleByDeviceWidth(10),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scaleByDeviceWidth(1),
    borderColor: '#826B4D',
    borderRadius: scaleByDeviceWidth(14),
    backgroundColor: 'rgba(91, 70, 48, 0.9)',
  },
  skillTimerIcon: {
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
  },
  skillTimerLabel: {
    marginLeft: scaleByDeviceWidth(7),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  skillTimerTrack: {
    width: SKILL_TIMER_TRACK_WIDTH,
    height: scaleByDeviceWidth(8),
    marginLeft: scaleByDeviceWidth(8),
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(4),
    backgroundColor: '#A48D6B',
  },
  skillTimerFill: {
    height: '100%',
    borderRadius: scaleByDeviceWidth(4),
    backgroundColor: '#FFD04A',
  },
  skillSelectionDivider: {
    width: scaleByDeviceWidth(320),
    height: scaleByDeviceWidth(24),
    marginTop: scaleByDeviceWidth(24),
  },
  skillCards: {
    width: scaleByDeviceWidth(336),
    marginTop: scaleByDeviceWidth(40),
    gap: scaleByDeviceWidth(20),
  },
  skillCard: {
    position: 'relative',
    width: '100%',
    height: scaleByDeviceWidth(120),
    paddingTop: scaleByDeviceWidth(17),
    paddingHorizontal: scaleByDeviceWidth(20),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: scaleByDeviceWidth(5) },
    shadowOpacity: 0.35,
    shadowRadius: scaleByDeviceWidth(8),
    elevation: scaleByDeviceWidth(7),
  },
  skillCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(120),
  },
  pressedSkillCard: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  skillCardName: {
    color: '#67543D',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(27),
  },
  skillCardStats: {
    marginTop: scaleByDeviceWidth(10),
    flexDirection: 'row',
    gap: scaleByDeviceWidth(8),
  },
  skillCardStat: {
    flex: 1,
    height: scaleByDeviceWidth(45),
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: scaleByDeviceWidth(6),
  },
  trailingSkillCardStat: {
    transform: [{ translateX: scaleByDeviceWidth(8) }],
  },
  skillCardStatValue: {
    color: '#6D573E',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
  },
  skillTypeValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scaleByDeviceWidth(4),
  },
  skillTypeIcon: {
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  recommendedSkillBadge: {
    position: 'absolute',
    top: 0,
    right: scaleByDeviceWidth(24),
    width: scaleByDeviceWidth(45),
    height: scaleByDeviceWidth(48),
    zIndex: 1,
  },
  finalClashOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    zIndex: 10,
  },
  finalClashContent: {
    alignItems: 'center',
  },
  finalClashTitle: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  finalClashDescription: {
    marginTop: scaleByDeviceWidth(8),
    color: '#BDB8AD',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  finalClashTimer: {
    marginTop: scaleByDeviceWidth(10),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(25),
  },
  finalClashProgressBar: {
    position: 'relative',
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(44.9),
    marginTop: scaleByDeviceWidth(27.27),
  },
  cheerButton: {
    width: scaleByDeviceWidth(96),
    height: scaleByDeviceWidth(96),
    marginTop: scaleByDeviceWidth(64),
  },
  cheerButtonImage: {
    width: '100%',
    height: '100%',
  },
  cheerButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  cheerButtonLabel: {
    marginTop: scaleByDeviceWidth(8),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  broadcastDialog: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(40),
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(120),
  },
  broadcastDialogBackground: {
    width: '100%',
    height: '100%',
  },
  broadcastMessage: {
    position: 'absolute',
    top: scaleByDeviceWidth(22),
    right: scaleByDeviceWidth(86),
    left: scaleByDeviceWidth(20),
    color: '#8F7755',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(19),
  },
  broadcastAnimalName: {
    color: '#68553E',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(15),
  },
  broadcastAnimal: {
    position: 'absolute',
    top: scaleByDeviceWidth(16),
    right: scaleByDeviceWidth(20),
    width: scaleByDeviceWidth(54),
    height: scaleByDeviceWidth(54),
  },
});
