import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  getBattleArenaType,
  isBattleCoachId,
  type BattleArenaType,
  type BattleBroadcastEvent,
  type BattleEntry,
  type BattleState,
} from '@/src/entities/battle';
import type { CreatureEnvironment } from '@/src/entities/creature';
import {
  useSubmitBattleAction,
  type BattleActionResult,
} from '@/src/features/select-battle-skill';
import { useStartBattleFinalRound } from '@/src/features/start-battle-final-round';
import { useSubmitBattleFinalRound } from '@/src/features/submit-battle-final-round';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ARENA_BACKGROUNDS: Record<BattleArenaType, number> = {
  ground: require('@/src/shared/assets/images/battle/ground-arena-background.png'),
  sky: require('@/src/shared/assets/images/battle/sky-arena-background.png'),
  sea: require('@/src/shared/assets/images/battle/sea-arena-background.png'),
  space: require('@/src/shared/assets/images/battle/space-arena-background.png'),
};
const BATTLE_LOG_PANEL = require('@/src/shared/assets/images/battle/battle-log-panel.png');
const BATTLE_LOG_TITLE = require('@/src/shared/assets/images/battle/battle-log-title.png');
const BATTLE_LOG_LEFT_BUBBLE = require('@/src/shared/assets/images/battle/battle-log-left-bubble.png');
const BATTLE_LOG_RIGHT_BUBBLE = require('@/src/shared/assets/images/battle/battle-log-right-bubble.png');
const BATTLE_PROGRESS_BAR = require('@/src/shared/assets/images/battle/battle-progress-bar.png');
const BATTLE_PROGRESS_FILL = require('@/src/shared/assets/images/battle/battle-progress-fill.png');
const BATTLE_STATUS_BADGE = require('@/src/shared/assets/images/battle/battle-status-badge.png');
const BATTLE_ROUND_LABEL = require('@/src/shared/assets/images/battle/battle-round-label.png');
const OPPONENT_CREATURE = require('@/src/shared/assets/images/farm/kkomi.png');
const CREATURE_INFO_CARD = require('@/src/shared/assets/images/battle/creature-info-card.png');
const BALANCE_SKILL_TYPE = require('@/src/shared/assets/images/battle/balance-skill-type.png');
const COMPETITIVE_SKILL_TYPE = require('@/src/shared/assets/images/battle/competitive-skill-type.png');
const STABLE_SKILL_TYPE = require('@/src/shared/assets/images/battle/stable-skill-type.png');
const CHEER_BUTTON = require('@/src/shared/assets/images/battle/cheer-button.png');
const BATTLE_PROGRESS_INNER_WIDTH = scaleByDeviceWidth(310);
const BATTLE_PROGRESS_FILL_WIDTH = scaleByDeviceWidth(310);
const BATTLE_PROGRESS_FILL_HEIGHT = scaleByDeviceWidth(26);
const BATTLE_PROGRESS_FILL_IMAGE_WIDTH =
  BATTLE_PROGRESS_FILL_WIDTH * (2020 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_HEIGHT =
  BATTLE_PROGRESS_FILL_HEIGHT * (778 / 144);
const BATTLE_PROGRESS_FILL_IMAGE_LEFT =
  -BATTLE_PROGRESS_FILL_WIDTH * (74 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_TOP =
  -BATTLE_PROGRESS_FILL_HEIGHT * (303 / 144);
const BATTLE_STATUS_BADGE_SIZE = scaleByDeviceWidth(62);
const BROADCAST_EVENT_INTERVAL_MS = 2000;
const SKILL_SELECTION_DURATION_MS = 3000;

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
      return `${animalName}이(가) 티어 우위를 점했어요.`;
    case 'TYPE_ADVANTAGE':
      return `${animalName}이(가) 타입 상성 우위를 점했어요.`;
    case 'SKILL_NOT_SELECTED':
      return `${animalName}은 스킬을 사용하지 못했어요.`;
    case 'SKILL_TRIGGERED':
      return `${animalName}의 ${event.skillName ?? '스킬'}!`;
    case 'SKILL_FAILED':
      return `${animalName}은 스킬을 사용하지 못했어요.`;
    case 'SKILL_OFFSET':
      return '양쪽 스킬이 서로 상쇄됐어요.';
    case 'BATTLE_POINT_APPLIED':
      return `${event.winnerSide === 'USER' ? '유저' : '관장'} 진영이 승부 바를 ${event.point ?? 0}포인트 밀어냅니다!`;
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

  return (
    <ImageBackground
      accessibilityLabel={`${entry.animalName}, ${entry.tier} 티어, ${entry.cardType} 타입`}
      resizeMode="stretch"
      source={CREATURE_INFO_CARD}
      style={[
        styles.creatureInfoCard,
        isOpponent ? styles.opponentInfo : styles.playerInfo,
      ]}
    >
      <Text numberOfLines={1} style={styles.creatureName}>{entry.animalName}</Text>
      <Image
        resizeMode="contain"
        source={TYPE_BADGES[environment]}
        style={styles.typeBadge}
      />
      {visibleSkills.map((skill, index) => (
        <Pressable
          accessibilityLabel={`${skill.name} 선택, 발동 확률 ${skill.triggerPercentage}%, ${skill.point}포인트`}
          accessibilityRole={isOpponent ? undefined : 'button'}
          accessibilityState={{
            disabled:
              isOpponent || isSkillSelectionDisabled || !onSkillPress,
            selected: selectedSkill === skill.skill,
          }}
          disabled={isOpponent || isSkillSelectionDisabled || !onSkillPress}
          key={skill.skill}
          onPress={() => onSkillPress?.(skill.skill)}
          style={({ pressed }) => [
            styles.skillRow,
            index === 0 ? styles.firstSkillRow : styles.secondSkillRow,
            selectedSkill === skill.skill && styles.selectedSkillRow,
            pressed && styles.pressedSkillRow,
          ]}
        >
          <Text style={styles.skillName}>{skill.name}</Text>
          <Image
            resizeMode="contain"
            source={SKILL_TYPE_SOURCES[skill.battleType] ?? BALANCE_SKILL_TYPE}
            style={styles.skillType}
          />
        </Pressable>
      ))}
    </ImageBackground>
  );
}

export function BattleArenaScreen() {
  const logScrollViewRef = useRef<ScrollView>(null);
  const hasRequestedFinalRoundStartRef = useRef(false);
  const hasSubmittedFinalRoundResultRef = useRef(false);
  const finalTapCountRef = useRef(0);
  const selectionTimerActionSeqRef = useRef<number | null>(null);
  const submittedActionRef = useRef<{
    actionSeq: number;
    skill: string | null;
  } | null>(null);
  const { isLoading: isSubmittingAction, submitBattleAction } =
    useSubmitBattleAction();
  const {
    isLoading: isStartingFinalRound,
    startBattleFinalRound,
  } = useStartBattleFinalRound();
  const {
    isLoading: isSubmittingFinalRound,
    submitBattleFinalRound,
  } = useSubmitBattleFinalRound();
  const { coach, initialBattleState, npcParty, party } = useLocalSearchParams<{
    coach?: string | string[];
    initialBattleState?: string | string[];
    npcParty?: string | string[];
    party?: string | string[];
  }>();
  const coachParam = Array.isArray(coach) ? coach[0] : coach;
  const coachId = coachParam && isBattleCoachId(coachParam) ? coachParam : 'moru';
  const [arenaType] = useState(() => getBattleArenaType(coachId));
  const [partyMembers] = useState(() => parseParty(party));
  const [npcPartyMembers] = useState(() => parseParty(npcParty));
  const [battleState, setBattleState] = useState(() =>
    parseBattleState(initialBattleState),
  );
  const [lastAction, setLastAction] = useState<BattleActionResult | null>(null);
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
  const [displayedBroadcastEvents, setDisplayedBroadcastEvents] = useState<
    BattleBroadcastEvent[]
  >([]);
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
  const battleLogs = useMemo(() => {
    if (!battleState) {
      return [];
    }

    return displayedBroadcastEvents
      .map((event) => ({
        eventSeq: event.eventSeq,
        message: getEventMessage(
          event,
          battleState,
          partyMembers,
          npcPartyMembers,
        ),
        side:
          (event.animalSide ?? event.winnerSide) === 'NPC'
            ? ('opponent' as const)
            : ('player' as const),
      }));
  }, [battleState, displayedBroadcastEvents, npcPartyMembers, partyMembers]);
  const serverTimeOffsetMs = battleState?.serverTimeOffsetMs ?? 0;
  const currentServerTimeMs = nowMs + serverTimeOffsetMs;
  const selectionRemainingSeconds = skillSelectionDeadlineMs !== null
    ? Math.max(0, Math.ceil((skillSelectionDeadlineMs - nowMs) / 1000))
    : 0;
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
      !isSubmittingAction &&
      !isBroadcasting,
  );
  const canSelectSkill = Boolean(
    isSkillSelectionReady &&
      skillSelectionDeadlineMs !== null &&
      skillSelectionDeadlineMs > nowMs,
  );
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
            !knownEventSequencesRef.current.has(event.eventSeq),
        );

      if (nextEvents.length === 0) {
        return;
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
    },
    [],
  );
  const handleSubmitAction = useCallback(
    async (skill: string | null, isRetry = false) => {
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
        Alert.alert(
          '행동 처리 실패',
          '대전 행동을 처리하지 못했습니다. 다시 시도해 주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '다시 시도',
              onPress: () => void handleSubmitAction(selectedSkill, true),
            },
          ],
        );
        return;
      }

      if (result.action) {
        enqueueBroadcastEvents(result.action.broadcastEvents);
        setLastAction(result.action);
      }
      enqueueBroadcastEvents(result.state.broadcastEvents);

      if (
        !result.action &&
        result.state.nextActionSeq === actionSeq
      ) {
        submittedActionRef.current = null;
      }

      setBattleState(result.state);
    },
    [
      battleState,
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
        Alert.alert(
          '최종 승부 시작 실패',
          '최종 승부를 시작하지 못했습니다. 다시 시도해 주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '다시 시도',
              onPress: () => void handleStartFinalRound(true),
            },
          ],
        );
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
        Alert.alert(
          '최종 승부 결과 제출 실패',
          '최종 승부 결과를 제출하지 못했습니다. 다시 시도해 주세요.',
          [
            {
              text: '다시 시도',
              onPress: () => void handleSubmitFinalRound(true),
            },
          ],
          { cancelable: false },
        );
        return;
      }

      router.replace({
        pathname: '/battle-result',
        params: {
          battleId: String(result.battleId),
          battleResult: result.battleResult ?? undefined,
          coach: coachId,
          finalRoundResult: JSON.stringify(result),
          party: typeof party === 'string' ? party : party?.[0],
          reward: result.reward ? JSON.stringify(result.reward) : undefined,
        },
      });
    },
    [battleState, coachId, party, submitBattleFinalRound],
  );

  useEffect(() => {
    if (activeBroadcastEvent || broadcastQueue.length === 0) {
      return;
    }

    const [nextEvent, ...remainingEvents] = broadcastQueue;
    setBroadcastQueue(remainingEvents);
    setActiveBroadcastEvent(nextEvent ?? null);
  }, [activeBroadcastEvent, broadcastQueue]);

  useEffect(() => {
    if (!activeBroadcastEvent) {
      return;
    }

    if (!playedEventSequencesRef.current.has(activeBroadcastEvent.eventSeq)) {
      playedEventSequencesRef.current.add(activeBroadcastEvent.eventSeq);
      lastPlayedEventSequenceRef.current = activeBroadcastEvent.eventSeq;
      setDisplayedBroadcastEvents((currentEvents) => [
        ...currentEvents,
        activeBroadcastEvent,
      ]);
    }

    const timeoutId = setTimeout(
      () => setActiveBroadcastEvent(null),
      BROADCAST_EVENT_INTERVAL_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [activeBroadcastEvent]);

  useEffect(() => {
    if (!battleState) {
      return;
    }

    battleProgress.value = withTiming(getBattleProgress(battleState), {
      duration: 650,
    });
  }, [battleProgress, battleState]);

  useEffect(() => {
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
    }, 100);
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
      isBroadcasting
    ) {
      return;
    }

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
        party: typeof party === 'string' ? party : party?.[0],
        reward: battleState.reward
          ? JSON.stringify(battleState.reward)
          : undefined,
      },
    });
  }, [battleState, coachId, isBroadcasting, party]);

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
          대전 상태를 불러오지 못했습니다.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.stateErrorButton}>
          <Text style={styles.stateErrorButtonText}>돌아가기</Text>
        </Pressable>
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
          <Text style={styles.actionStatusText}>
            {battleState.completedActionCount}/{battleState.totalActionCount}
            {battleState.nextActionSeq !== null
              ? ` · 행동 ${battleState.nextActionSeq}${
                  skillSelectionDeadlineMs !== null
                    ? ` · ${selectionRemainingSeconds}초`
                    : ''
                }`
              : ''}
            {lastAction
              ? ` · ${lastAction.netPoint >= 0 ? '+' : ''}${lastAction.netPoint}`
              : ''}
            {isStartingFinalRound ? ' · 최종 승부 준비 중' : ''}
          </Text>

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

          <View style={styles.skillSelectionArea}>
            {canSelectSkill && (
              <View style={styles.skillSelectionPanel}>
                <Text style={styles.skillSelectionTitle}>
                  사용할 스킬을 선택하세요
                </Text>
                <View style={styles.skillSelectionButtons}>
                  {(battleState.userEntry.skills ?? [])
                    .slice(0, 2)
                    .map((skill) => (
                      <Pressable
                        accessibilityLabel={`${skill.name}, 발동 확률 ${skill.triggerPercentage}%, ${skill.point}포인트`}
                        accessibilityRole="button"
                        key={skill.skill}
                        onPress={() => void handleSubmitAction(skill.skill)}
                        style={({ pressed }) => [
                          styles.skillSelectionButton,
                          pressed && styles.pressedSkillSelectionButton,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={styles.skillSelectionName}
                        >
                          {skill.name}
                        </Text>
                        <Text style={styles.skillSelectionMeta}>
                          {skill.triggerPercentage}% · {skill.point}P
                        </Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            )}
            {isSubmittingAction && (
              <Text style={styles.skillSelectionStatus}>행동 처리 중...</Text>
            )}
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.logRegionContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.logRegionScroll}
          >
            <ImageBackground
              resizeMode="stretch"
              source={BATTLE_LOG_PANEL}
              style={styles.logPanel}
            >
              <Image resizeMode="contain" source={BATTLE_LOG_TITLE} style={styles.logTitle} />
              <ScrollView
                contentContainerStyle={styles.logContent}
                nestedScrollEnabled
                onContentSizeChange={() =>
                  logScrollViewRef.current?.scrollToEnd({ animated: true })
                }
                ref={logScrollViewRef}
                showsVerticalScrollIndicator
                style={styles.logScroll}
              >
                {battleLogs.map((log) => (
                  <ImageBackground
                    key={log.eventSeq}
                    resizeMode="stretch"
                    source={
                      log.side === 'player'
                        ? BATTLE_LOG_LEFT_BUBBLE
                        : BATTLE_LOG_RIGHT_BUBBLE
                    }
                    style={[
                      styles.logBubble,
                      log.side === 'player'
                        ? styles.playerLogBubble
                        : styles.opponentLogBubble,
                    ]}
                  >
                    <Text numberOfLines={2} style={styles.logText}>{log.message}</Text>
                  </ImageBackground>
                ))}
              </ScrollView>
            </ImageBackground>
          </ScrollView>
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
    paddingTop: scaleByDeviceWidth(8),
    paddingBottom: scaleByDeviceWidth(8),
  },
  roundLabel: {
    width: scaleByDeviceWidth(89.33),
    height: scaleByDeviceWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    color: '#3E352B',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(19),
  },
  actionStatusText: {
    height: scaleByDeviceWidth(18),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  battleField: {
    position: 'relative',
    width: '100%',
    height: scaleByDeviceWidth(324),
  },
  creatureInfoCard: {
    position: 'absolute',
    width: scaleByDeviceWidth(131.25),
    height: scaleByDeviceWidth(95.5),
  },
  opponentInfo: {
    top: scaleByDeviceWidth(18),
    left: scaleByDeviceWidth(25),
  },
  playerInfo: {
    right: scaleByDeviceWidth(24),
    bottom: scaleByDeviceWidth(13),
  },
  creatureName: {
    position: 'absolute',
    top: scaleByDeviceWidth(17),
    left: scaleByDeviceWidth(14),
    right: scaleByDeviceWidth(32),
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(13),
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    right: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(33),
  },
  skillRow: {
    position: 'absolute',
    left: scaleByDeviceWidth(19),
    right: scaleByDeviceWidth(17),
    height: scaleByDeviceWidth(17),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSkillRow: {
    borderRadius: scaleByDeviceWidth(5),
    backgroundColor: 'rgba(255, 211, 78, 0.32)',
  },
  pressedSkillRow: {
    opacity: 0.7,
  },
  firstSkillRow: {
    top: scaleByDeviceWidth(45),
  },
  secondSkillRow: {
    top: scaleByDeviceWidth(66),
  },
  skillName: {
    color: '#655742',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(11),
  },
  skillType: {
    width: scaleByDeviceWidth(29),
    height: scaleByDeviceWidth(12),
  },
  opponentCreature: {
    position: 'absolute',
    top: scaleByDeviceWidth(34),
    right: scaleByDeviceWidth(35),
    width: scaleByDeviceWidth(108),
    height: scaleByDeviceWidth(108),
  },
  playerCreature: {
    position: 'absolute',
    left: scaleByDeviceWidth(24),
    bottom: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(132),
    height: scaleByDeviceWidth(132),
  },
  statusBar: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(54),
  },
  skillSelectionArea: {
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(82),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillSelectionPanel: {
    width: '100%',
    alignItems: 'center',
    gap: scaleByDeviceWidth(6),
  },
  skillSelectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(15),
  },
  skillSelectionButtons: {
    flexDirection: 'row',
    gap: scaleByDeviceWidth(8),
  },
  skillSelectionButton: {
    width: scaleByDeviceWidth(150),
    height: scaleByDeviceWidth(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scaleByDeviceWidth(2),
    borderColor: '#E8D5B4',
    borderRadius: scaleByDeviceWidth(10),
    backgroundColor: '#FFF8ED',
  },
  pressedSkillSelectionButton: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  skillSelectionName: {
    maxWidth: scaleByDeviceWidth(136),
    color: '#675744',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(13),
    lineHeight: scaleByDeviceWidth(18),
  },
  skillSelectionMeta: {
    color: '#9B805D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(9),
    lineHeight: scaleByDeviceWidth(13),
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
    left: scaleByDeviceWidth(13),
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
    top: scaleByDeviceWidth(-4),
    left: scaleByDeviceWidth(13),
    width: BATTLE_STATUS_BADGE_SIZE,
    height: BATTLE_STATUS_BADGE_SIZE,
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
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(54),
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
  logPanel: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(306),
    paddingTop: scaleByDeviceWidth(42),
    paddingHorizontal: scaleByDeviceWidth(20),
    paddingBottom: scaleByDeviceWidth(18),
  },
  logRegionScroll: {
    flex: 1,
    width: '100%',
  },
  logRegionContent: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(20),
    paddingBottom: scaleByDeviceWidth(8),
  },
  logTitle: {
    position: 'absolute',
    top: scaleByDeviceWidth(-15),
    left: scaleByDeviceWidth(104),
    width: scaleByDeviceWidth(128),
    height: scaleByDeviceWidth(32),
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    gap: scaleByDeviceWidth(10),
    paddingRight: scaleByDeviceWidth(3),
  },
  logBubble: {
    width: scaleByDeviceWidth(290),
    height: scaleByDeviceWidth(54),
    justifyContent: 'center',
    paddingHorizontal: scaleByDeviceWidth(22),
  },
  playerLogBubble: {
    alignSelf: 'flex-start',
  },
  opponentLogBubble: {
    alignSelf: 'flex-end',
  },
  logText: {
    color: '#725E42',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
});
