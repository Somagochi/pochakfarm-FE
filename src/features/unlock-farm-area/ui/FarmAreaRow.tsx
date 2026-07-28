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
            const nameplateWidth = slotSize;
            const nameplateHeight = nameplateWidth * (144 / 529);
            const animalSize = slotSize;

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
                      top: slotSize * 0.04,
                      width: animalSize,
                      height: animalSize,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.nameplate,
                    {
                      top: -nameplateHeight * 0.62,
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
                      { fontSize: 10 * scale },
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
    paddingBottom: 1,
  },
  nameplateImage: {
    position: 'absolute',
  },
  creatureName: {
    color: '#6B4B27',
    fontFamily: 'EliceDXNeolli-Bold',
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
