import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

const FARM_SLOT_IMAGE = require('@/src/shared/assets/images/farm/farm-slot.png');
const UNLOCK_AREA_IMAGE = require('@/src/shared/assets/images/farm/unlock-area.png');

const BASE_SLOT_SIZE = 58.4;
const BASE_SLOT_GAP = 26.6;
const SLOT_COUNT = 4;
const BASE_UNLOCK_IMAGE_WIDTH = 112;
const BASE_UNLOCK_IMAGE_HEIGHT = 88.76;

type FarmAreaRowProps = {
  areaNumber: number;
  isUnlocked: boolean;
  onPressSlot: (slotNumber: number) => void;
  onPressUnlock: () => void;
  scale: number;
};

export function FarmAreaRow({
  areaNumber,
  isUnlocked,
  onPressSlot,
  onPressUnlock,
  scale,
}: FarmAreaRowProps) {
  const slotSize = BASE_SLOT_SIZE * scale;
  const slotGap = BASE_SLOT_GAP * scale;
  const rowWidth = slotSize * SLOT_COUNT + slotGap * (SLOT_COUNT - 1);
  const unlockImageWidth = BASE_UNLOCK_IMAGE_WIDTH * scale;
  const unlockImageHeight = BASE_UNLOCK_IMAGE_HEIGHT * scale;

  return (
    <View
      style={[
        styles.row,
        {
          columnGap: slotGap,
          width: rowWidth,
          height: slotSize,
        },
      ]}
    >
      {isUnlocked &&
        Array.from({ length: SLOT_COUNT }, (_, index) => {
          const slotNumber = index + 1;

          return (
            <Pressable
              accessibilityLabel={`${areaNumber}번째 농장 ${slotNumber}번째 포착 슬롯`}
              accessibilityRole="button"
              key={slotNumber}
              onPress={() => onPressSlot(slotNumber)}
              style={({ pressed }) => [
                styles.slotButton,
                { width: slotSize, height: slotSize },
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={FARM_SLOT_IMAGE}
                style={{ width: slotSize, height: slotSize }}
              />
            </Pressable>
          );
        })}

      {!isUnlocked && (
        <Pressable
          accessibilityLabel={`${areaNumber}번째 농장 잠금 해제`}
          accessibilityRole="button"
          onPress={onPressUnlock}
          style={({ pressed }) => [
            styles.unlockButton,
            {
              top: (slotSize - unlockImageHeight) / 2,
              left: (rowWidth - unlockImageWidth) / 2,
              width: unlockImageWidth,
              height: unlockImageHeight,
            },
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={UNLOCK_AREA_IMAGE}
            style={styles.unlockImage}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  slotButton: {},
  unlockButton: {
    position: 'absolute',
    zIndex: 2,
  },
  unlockImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
