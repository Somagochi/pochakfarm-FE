import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { FarmCreatureListItem } from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const AUTO_MATCH_CARD = require('@/src/shared/assets/images/battle/auto-match-card.png');
const AUTO_MATCH_COIN_BUTTON = require('@/src/shared/assets/images/battle/auto-match-coin-button.png');
const BATTLE_PARTY_CARD = require('@/src/shared/assets/images/battle/battle-party-card.png');
const EMPTY_PARTY_SLOT = require('@/src/shared/assets/images/battle/empty-party-slot.png');
const REMOVE_PARTY_SLOT_BUTTON = require('@/src/shared/assets/images/battle/remove-party-slot-button.png');
const TYPE_SELECTION_TIP = require('@/src/shared/assets/images/battle/type-selection-tip.png');
const AUTO_MATCH_CARD_WIDTH = scaleByDeviceWidth(112);
const AUTO_MATCH_CARD_HEIGHT = AUTO_MATCH_CARD_WIDTH * (326 / 448);
const BATTLE_PARTY_CARD_WIDTH = scaleByDeviceWidth(208);
const BATTLE_PARTY_CARD_HEIGHT = BATTLE_PARTY_CARD_WIDTH * (324 / 836);
const COIN_BUTTON_WIDTH = scaleByDeviceWidth(64);
const COIN_BUTTON_HEIGHT = COIN_BUTTON_WIDTH * (109 / 256);
const TIP_WIDTH = scaleByDeviceWidth(284);
const TIP_HEIGHT = TIP_WIDTH * (112 / 1136);
const PARTY_SLOT_SIZE = scaleByDeviceWidth(54);
const PARTY_SLOT_GAP = scaleByDeviceWidth(8);
const PARTY_SLOT_STRIDE = PARTY_SLOT_SIZE + PARTY_SLOT_GAP;

type BattleMatchSelectionProps = {
  onMoveCreature: (fromIndex: number, toIndex: number) => void;
  onRemoveCreature: (creatureId: string) => void;
  selectedCreatures: FarmCreatureListItem[];
};

type DraggablePartySlotProps = {
  creature: FarmCreatureListItem;
  index: number;
  onMoveCreature: (fromIndex: number, toIndex: number) => void;
  onRemoveCreature: (creatureId: string) => void;
  selectedCount: number;
};

function DraggablePartySlot({
  creature,
  index,
  onMoveCreature,
  onRemoveCreature,
  selectedCount,
}: DraggablePartySlotProps) {
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const gesture = Gesture.Pan()
    .activeOffsetX([-scaleByDeviceWidth(4), scaleByDeviceWidth(4)])
    .failOffsetY([-scaleByDeviceWidth(8), scaleByDeviceWidth(8)])
    .onBegin(() => {
      'worklet';
      isDragging.value = true;
      scale.value = withTiming(1.06, { duration: 100 });
    })
    .onUpdate((event) => {
      'worklet';
      const minTranslateX = -index * PARTY_SLOT_STRIDE;
      const maxTranslateX =
        (selectedCount - 1 - index) * PARTY_SLOT_STRIDE;

      translateX.value = Math.max(
        minTranslateX,
        Math.min(event.translationX, maxTranslateX),
      );
    })
    .onEnd(() => {
      'worklet';
      const movedSlotCount = Math.round(
        translateX.value / PARTY_SLOT_STRIDE,
      );
      const targetIndex = Math.max(
        0,
        Math.min(index + movedSlotCount, selectedCount - 1),
      );

      if (targetIndex !== index) {
        scheduleOnRN(onMoveCreature, index, targetIndex);
      }

    })
    .onFinalize(() => {
      'worklet';
      translateX.value = withTiming(0, { duration: 140 });
      scale.value = withTiming(1, { duration: 100 });
      isDragging.value = false;
    });
  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: isDragging.value ? 2 : 0,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(100)}
        layout={LinearTransition.duration(180)}
        style={[styles.selectedSlot, animatedStyle]}
      >
        <Image
          resizeMode="contain"
          source={creature.creatureImageSource}
          style={styles.selectedCreatureImage}
        />
        <Text numberOfLines={1} style={styles.selectedCreatureName}>
          {creature.name}
        </Text>
        <Pressable
          accessibilityLabel={`${creature.name} 선택 해제`}
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(6)}
          onPress={() => onRemoveCreature(creature.id)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={REMOVE_PARTY_SLOT_BUTTON}
            style={styles.removeButtonImage}
          />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

export function BattleMatchSelection({
  onMoveCreature,
  onRemoveCreature,
  selectedCreatures,
}: BattleMatchSelectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.cardRow}>
        <ImageBackground
          resizeMode="contain"
          source={AUTO_MATCH_CARD}
          style={styles.autoMatchCard}
        >
          <Pressable
            accessibilityLabel="10코인으로 자동 매칭"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.coinButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={AUTO_MATCH_COIN_BUTTON}
              style={styles.coinButtonImage}
            />
          </Pressable>
        </ImageBackground>
        <ImageBackground
          resizeMode="contain"
          source={BATTLE_PARTY_CARD}
          style={styles.partyCard}
        >
          <View style={styles.partySlots}>
            {[0, 1, 2].map((slotIndex) => {
              const creature = selectedCreatures[slotIndex];

              if (!creature) {
                return (
                  <Animated.View
                    entering={FadeIn.duration(140)}
                    key={`empty-${slotIndex}`}
                    layout={LinearTransition.duration(180)}
                    style={styles.partySlot}
                  >
                    <Image
                      accessibilityLabel={`${slotIndex + 1}번 빈 출전 슬롯`}
                      resizeMode="contain"
                      source={EMPTY_PARTY_SLOT}
                      style={styles.emptySlot}
                    />
                  </Animated.View>
                );
              }

              return (
                <DraggablePartySlot
                  creature={creature}
                  index={slotIndex}
                  key={creature.id}
                  onMoveCreature={onMoveCreature}
                  onRemoveCreature={onRemoveCreature}
                  selectedCount={selectedCreatures.length}
                />
              );
            })}
          </View>
        </ImageBackground>
      </View>
      <Image
        accessibilityLabel="공격형 타입의 동물을 선택해보세요"
        resizeMode="contain"
        source={TYPE_SELECTION_TIP}
        style={styles.tip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(328),
    alignItems: 'center',
    gap: scaleByDeviceWidth(8),
  },
  cardRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleByDeviceWidth(8),
  },
  autoMatchCard: {
    width: AUTO_MATCH_CARD_WIDTH,
    height: AUTO_MATCH_CARD_HEIGHT,
    alignItems: 'center',
  },
  coinButton: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(8),
    width: COIN_BUTTON_WIDTH,
    height: COIN_BUTTON_HEIGHT,
  },
  coinButtonImage: {
    width: '100%',
    height: '100%',
  },
  partyCard: {
    width: BATTLE_PARTY_CARD_WIDTH,
    height: BATTLE_PARTY_CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySlots: {
    flexDirection: 'row',
    gap: PARTY_SLOT_GAP,
  },
  emptySlot: {
    width: '100%',
    height: '100%',
  },
  partySlot: {
    width: PARTY_SLOT_SIZE,
    height: PARTY_SLOT_SIZE,
  },
  selectedSlot: {
    position: 'relative',
    width: PARTY_SLOT_SIZE,
    height: PARTY_SLOT_SIZE,
    alignItems: 'center',
  },
  selectedCreatureImage: {
    width: scaleByDeviceWidth(48),
    height: scaleByDeviceWidth(40),
  },
  selectedCreatureName: {
    width: '100%',
    color: '#4F4B43',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(11),
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: scaleByDeviceWidth(12),
    height: scaleByDeviceWidth(12.75),
  },
  removeButtonImage: {
    width: '100%',
    height: '100%',
  },
  tip: {
    width: TIP_WIDTH,
    height: TIP_HEIGHT,
  },
  pressed: {
    opacity: 0.8,
  },
});
