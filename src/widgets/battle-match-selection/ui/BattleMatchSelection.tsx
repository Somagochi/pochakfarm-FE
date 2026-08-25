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

const CREATURE_CARD_BACKGROUND = require('@/src/shared/assets/images/farm-search/creature-search-card-background.png');
const COACH_RECOMMENDATION_CARD = require('@/src/shared/assets/images/battle/coach-recommendation-card.png');
const EMPTY_PARTY_SLOT = require('@/src/shared/assets/images/battle/empty-party-slot.png');
const PARTY_SEQUENCE_ARROW = require('@/src/shared/assets/images/battle/party-sequence-arrow.png');
const REMOVE_PARTY_SLOT_BUTTON = require('@/src/shared/assets/images/battle/remove-party-slot-button.png');
const TYPE_SELECTION_TIP = require('@/src/shared/assets/images/battle/type-selection-tip.png');
const PARTY_SLOT_WIDTH = scaleByDeviceWidth(58);
const PARTY_SLOT_HEIGHT = PARTY_SLOT_WIDTH * (564 / 404);
const PARTY_SLOT_GAP = scaleByDeviceWidth(3.5);
const PARTY_ARROW_WIDTH = scaleByDeviceWidth(8);
const PARTY_ARROW_HEIGHT = PARTY_ARROW_WIDTH * (26 / 32);
const PARTY_SLOT_STRIDE =
  PARTY_SLOT_WIDTH + PARTY_ARROW_WIDTH + PARTY_SLOT_GAP * 2;
const EMPTY_SLOT_SIZE = scaleByDeviceWidth(40);
const TIP_WIDTH = scaleByDeviceWidth(219);
const TIP_HEIGHT = TIP_WIDTH * (68 / 876);
const RECOMMENDATION_WIDTH = scaleByDeviceWidth(112);
const RECOMMENDATION_HEIGHT = RECOMMENDATION_WIDTH * (450 / 448);

type BattleMatchSelectionProps = {
  onMoveCreature: (fromIndex: number, toIndex: number) => void;
  onRemoveCreature: (creatureId: string) => void;
  selectedCreatures: FarmCreatureListItem[];
  userLevel?: number;
  userNickname?: string | null;
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
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const gesture = Gesture.Pan()
    .activeOffsetX([-scaleByDeviceWidth(4), scaleByDeviceWidth(4)])
    .failOffsetY([-scaleByDeviceWidth(8), scaleByDeviceWidth(8)])
    .onBegin(() => {
      'worklet';
      isDragging.value = true;
      rotation.value = withTiming(-3, { duration: 100 });
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
      rotation.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(1, { duration: 100 });
      isDragging.value = false;
    });
  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: isDragging.value ? 2 : 0,
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotation.value}deg` },
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
        <ImageBackground
          resizeMode="stretch"
          source={CREATURE_CARD_BACKGROUND}
          style={styles.selectedCard}
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
        </ImageBackground>
      </Animated.View>
    </GestureDetector>
  );
}

export function BattleMatchSelection({
  onMoveCreature,
  onRemoveCreature,
  selectedCreatures,
  userLevel,
  userNickname,
}: BattleMatchSelectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.selectionColumn}>
        <View style={styles.partySlots}>
          {[0, 1, 2].map((slotIndex) => {
            const creature = selectedCreatures[slotIndex];

            return (
              <View key={`party-position-${slotIndex}`} style={styles.partyPosition}>
                {creature ? (
                  <DraggablePartySlot
                    creature={creature}
                    index={slotIndex}
                    onMoveCreature={onMoveCreature}
                    onRemoveCreature={onRemoveCreature}
                    selectedCount={selectedCreatures.length}
                  />
                ) : (
                  <Animated.View
                    entering={FadeIn.duration(140)}
                    key={`empty-${slotIndex}`}
                    layout={LinearTransition.duration(180)}
                    style={styles.partySlot}
                  >
                    <ImageBackground
                      resizeMode="stretch"
                      source={CREATURE_CARD_BACKGROUND}
                      style={styles.emptyCard}
                    >
                      <Image
                        accessibilityLabel={`${slotIndex + 1}번 빈 출전 슬롯`}
                        resizeMode="contain"
                        source={EMPTY_PARTY_SLOT}
                        style={styles.emptySlot}
                      />
                    </ImageBackground>
                  </Animated.View>
                )}
                {slotIndex < 2 && (
                  <Image
                    accessible={false}
                    resizeMode="contain"
                    source={PARTY_SEQUENCE_ARROW}
                    style={styles.partyArrow}
                  />
                )}
              </View>
            );
          })}
        </View>
        <Image
          accessibilityLabel="공격형 타입의 동물을 선택해보세요"
          resizeMode="contain"
          source={TYPE_SELECTION_TIP}
          style={styles.tip}
        />
      </View>
      <ImageBackground
        accessibilityLabel={`관장 정보: 레벨 ${userLevel ?? ''}, 닉네임 ${userNickname ?? ''}, 추천 타입 땅과 바다`}
        resizeMode="contain"
        source={COACH_RECOMMENDATION_CARD}
        style={styles.recommendationCard}
      >
        <View style={styles.coachIdentity}>
          <Text style={styles.coachLevel}>
            {userLevel !== undefined ? `Lv.${userLevel}` : ''}
          </Text>
          <Text numberOfLines={1} style={styles.coachNickname}>
            {userNickname ?? ''}
          </Text>
        </View>
        <View style={styles.recommendedType}>
          <Text style={styles.recommendedTypeLabel}>추천타입</Text>
          <Text style={styles.recommendedTypeValue}>땅 · 바다</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(328),
    height: RECOMMENDATION_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  selectionColumn: {
    width: TIP_WIDTH,
    paddingTop: scaleByDeviceWidth(5),
    gap: scaleByDeviceWidth(6),
  },
  partySlots: {
    width: scaleByDeviceWidth(204),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PARTY_SLOT_GAP,
  },
  partyArrow: {
    width: PARTY_ARROW_WIDTH,
    height: PARTY_ARROW_HEIGHT,
  },
  emptySlot: {
    width: EMPTY_SLOT_SIZE,
    height: EMPTY_SLOT_SIZE,
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySlot: {
    width: PARTY_SLOT_WIDTH,
    height: PARTY_SLOT_HEIGHT,
  },
  selectedSlot: {
    position: 'relative',
    width: PARTY_SLOT_WIDTH,
    height: PARTY_SLOT_HEIGHT,
  },
  selectedCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCreatureImage: {
    width: scaleByDeviceWidth(46),
    height: scaleByDeviceWidth(42),
  },
  selectedCreatureName: {
    width: scaleByDeviceWidth(52),
    color: '#4F4B43',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(9),
    lineHeight: scaleByDeviceWidth(13),
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(7),
    right: scaleByDeviceWidth(5),
    width: scaleByDeviceWidth(8),
    height: scaleByDeviceWidth(8.5),
  },
  removeButtonImage: {
    width: '100%',
    height: '100%',
  },
  tip: {
    width: TIP_WIDTH,
    height: TIP_HEIGHT,
  },
  recommendationCard: {
    width: RECOMMENDATION_WIDTH,
    height: RECOMMENDATION_HEIGHT,
  },
  coachIdentity: {
    position: 'absolute',
    top: scaleByDeviceWidth(12),
    right: scaleByDeviceWidth(10),
    alignItems: 'flex-end',
  },
  coachLevel: {
    color: '#CFB78D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(16),
  },
  coachNickname: {
    maxWidth: scaleByDeviceWidth(92),
    color: '#675744',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
  },
  recommendedType: {
    position: 'absolute',
    right: scaleByDeviceWidth(10),
    bottom: scaleByDeviceWidth(11),
    alignItems: 'flex-end',
  },
  recommendedTypeLabel: {
    color: '#D7BD8C',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  recommendedTypeValue: {
    color: '#8B704D',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(16),
  },
  pressed: {
    opacity: 0.8,
  },
});
