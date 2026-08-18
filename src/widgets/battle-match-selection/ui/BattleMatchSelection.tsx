import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

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

type BattleMatchSelectionProps = {
  onRemoveCreature: (creatureId: string) => void;
  selectedCreatures: FarmCreatureListItem[];
};

export function BattleMatchSelection({
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
                <Animated.View
                  entering={FadeIn.duration(140)}
                  exiting={FadeOut.duration(100)}
                  key={creature.id}
                  layout={LinearTransition.duration(180)}
                  style={styles.selectedSlot}
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
    gap: scaleByDeviceWidth(8),
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
