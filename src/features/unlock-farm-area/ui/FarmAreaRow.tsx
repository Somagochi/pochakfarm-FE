import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const FARM_SLOT_IMAGE = require('@/src/shared/assets/images/farm/farm-slot.png');
const BASE_SLOT_SIZE = 58.4;
const BASE_SLOT_GAP = 26.6;
const BASE_CREATURE_WIDTH = 80;
const BASE_CREATURE_HEIGHT = 73;
const BASE_CREATURE_TOP_OFFSET = 4;
const BASE_NAMEPLATE_WIDTH = 73;
const BASE_NAMEPLATE_HEIGHT = 24;
const BASE_NAMEPLATE_TOP_OFFSET = 5;
const SLOT_COUNT = 4;
const BASE_UNLOCK_IMAGE_WIDTH = 112;

type FarmAreaRowProps = {
  areaNumber: number;
  creatureSlot?: {
    animalImageSource: ImageSourcePropType;
    name: string;
    nameplateImageSource: ImageSourcePropType;
    slotNumber: number;
  };
  isUnlockAvailable: boolean;
  isUnlocked: boolean;
  onPressCreature?: () => void;
  onPressSlot: (slotNumber: number) => void;
  onPressUnlock: () => void;
  scale: number;
  unlockImageSource: ImageSourcePropType;
};

export function FarmAreaRow({
  areaNumber,
  creatureSlot,
  isUnlockAvailable,
  isUnlocked,
  onPressCreature,
  onPressSlot,
  onPressUnlock,
  scale,
  unlockImageSource,
}: FarmAreaRowProps) {
  const slotSize = BASE_SLOT_SIZE * scale;
  const slotGap = BASE_SLOT_GAP * scale;
  const rowWidth = slotSize * SLOT_COUNT + slotGap * (SLOT_COUNT - 1);
  const unlockImageWidth = BASE_UNLOCK_IMAGE_WIDTH * scale;
  const { width: sourceWidth, height: sourceHeight } =
    Image.resolveAssetSource(unlockImageSource);
  const unlockImageHeight =
    BASE_UNLOCK_IMAGE_WIDTH * (sourceHeight / sourceWidth) * scale;

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

          if (slotNumber === creatureSlot?.slotNumber) {
            const nameplateWidth = BASE_NAMEPLATE_WIDTH * scale;
            const nameplateHeight = BASE_NAMEPLATE_HEIGHT * scale;
            const animalWidth = BASE_CREATURE_WIDTH * scale;
            const animalHeight = BASE_CREATURE_HEIGHT * scale;

            return (
              <Pressable
                accessibilityLabel={`${creatureSlot.name} 농장 슬롯`}
                accessibilityRole="button"
                key={slotNumber}
                onPress={onPressCreature}
                style={({ pressed }) => [
                  styles.creatureSlot,
                  { width: slotSize, height: slotSize },
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={creatureSlot.animalImageSource}
                  style={[
                    styles.creatureImage,
                    {
                      top:
                        slotSize * 0.04 +
                        BASE_CREATURE_TOP_OFFSET * scale,
                      left: (slotSize - animalWidth) / 2,
                      width: animalWidth,
                      height: animalHeight,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.nameplate,
                    {
                      top:
                        -nameplateHeight * 0.62 -
                        BASE_NAMEPLATE_TOP_OFFSET * scale,
                      left: (slotSize - nameplateWidth) / 2,
                      width: nameplateWidth,
                      height: nameplateHeight,
                    },
                  ]}
                >
                  <Image
                    resizeMode="stretch"
                    source={creatureSlot.nameplateImageSource}
                    style={[
                      styles.nameplateImage,
                      {
                        width: nameplateWidth,
                        height: nameplateHeight,
                      },
                    ]}
                  />
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[
                      styles.creatureName,
                      {
                        fontSize: 12 * scale,
                        lineHeight: 12 * scale,
                      },
                    ]}
                  >
                    {creatureSlot.name}
                  </Text>
                </View>
              </Pressable>
            );
          }

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

      {isUnlockAvailable && (
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
            source={unlockImageSource}
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
  creatureSlot: {
    alignItems: 'center',
    overflow: 'visible',
  },
  creatureImage: {
    position: 'absolute',
  },
  nameplate: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameplateImage: {
    position: 'absolute',
  },
  creatureName: {
    color: '#6B4B27',
    fontFamily: 'MemomentKkukkukk',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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
