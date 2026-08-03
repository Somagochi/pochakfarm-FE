import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useAnimalDetail,
  type AnimalCardType,
  type CreatureTier,
} from '@/src/entities/creature';
import { useReleaseAnimal } from '@/src/features/release-creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ReleaseCreatureAlert } from '@/src/shared/ui/ReleaseCreatureAlert';

const BOTTOM_SHEET_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-bottom-sheet.png');
const DETAIL_TOGGLE_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-toggle.png');
const CARD_DETAIL_TOGGLE_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-card-toggle.png');
const CREATURE_CARD_FRAME_IMAGE = require('@/src/shared/assets/images/farm/creature-card-frame.png');
const CREATURE_CARD_IMAGE = require('@/src/shared/assets/images/farm/kkomi-card.png');
const ANIMAL_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/animal-image-placeholder.png');
const CARD_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/card-image-placeholder.png');
const CREATURE_CARD_BACK_IMAGES: Record<AnimalCardType, number> = {
  GROUND: require('@/src/shared/assets/images/farm/card-back-ground.png'),
  SEA: require('@/src/shared/assets/images/farm/card-back-sea.png'),
  SKY: require('@/src/shared/assets/images/farm/kkomi-card-back.png'),
  SPACE: require('@/src/shared/assets/images/farm/card-back-space.png'),
};
const CREATURE_CARD_NAME_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-card-name-field.png');
const PROFILE_LABEL_IMAGE = require('@/src/shared/assets/images/farm/creature-profile-label.png');
const CARD_LABEL_IMAGE = require('@/src/shared/assets/images/farm/creature-card-label.png');
const DETAIL_FRAME_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-frame.png');
const CREATURE_IMAGE = require('@/src/shared/assets/images/farm/kkomi.png');
const NAME_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-name-field.png');
const TYPE_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-type-field.png');
const TIER_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-tier-field.png');
const CREATURE_TIER_IMAGES: Record<CreatureTier, number> = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
};
const CREATURE_TYPE_NAMES: Record<AnimalCardType, string> = {
  GROUND: '땅',
  SEA: '바다',
  SKY: '하늘',
  SPACE: '우주',
};
const CREATURE_TYPE = '땅';
const CREATURE_TIER: CreatureTier = 'S';
const CREATURE_TRAITS = [
  {
    name: '오물오물',
    description: '작은 입으로 천천히 먹이를 오물오물 즐겨요.',
  },
  {
    name: '말랑한 친구',
    description: '포근한 매력으로 주변을 만만하게 만들어줘요.',
  },
] as const;
const SKILL_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-skill-field.png');
const JOURNEY_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/creature-journey-button.png');
const SHEET_ASPECT_RATIO = 1440 / 2756;
const DETAIL_TOGGLE_WIDTH = scaleByDeviceWidth(218);
const DETAIL_TOGGLE_HEIGHT = scaleByDeviceWidth(35);
const IMAGE_BOX_TOP_RATIO = 340 / 2756;
const DETAIL_TOGGLE_GAP = scaleByDeviceWidth(12);
const DETAIL_FRAME_WIDTH = scaleByDeviceWidth(298);
const DETAIL_FRAME_HEIGHT = scaleByDeviceWidth(283);
const CREATURE_SIZE = scaleByDeviceWidth(220);
const CREATURE_TOP_OFFSET = scaleByDeviceWidth(40);
const NAME_FIELD_TOP_GAP = scaleByDeviceWidth(16);
const NAME_FIELD_WIDTH = scaleByDeviceWidth(308);
const NAME_LABEL_WIDTH = scaleByDeviceWidth(97);
const FIELD_HEIGHT = scaleByDeviceWidth(40);
const DETAIL_FIELDS_ROW_TOP_GAP = scaleByDeviceWidth(8);
const DETAIL_FIELD_WIDTH = scaleByDeviceWidth(148);
const DETAIL_FIELD_LABEL_WIDTH = scaleByDeviceWidth(67);
const DETAIL_FIELDS_ROW_GAP = scaleByDeviceWidth(12);
const TIER_IMAGE_WIDTH = scaleByDeviceWidth(20.55);
const TIER_IMAGE_HEIGHT = scaleByDeviceWidth(27.54);
const SECTION_GAP = scaleByDeviceWidth(8);
const SKILL_FIELD_HEIGHT = scaleByDeviceWidth(60.42);
const TRAIT_TEXT_GAP = scaleByDeviceWidth(2);
const TRAIT_NAME_FONT_SIZE = scaleByDeviceWidth(16);
const TRAIT_NAME_LINE_HEIGHT = TRAIT_NAME_FONT_SIZE * 1.4;
const TRAIT_DESCRIPTION_FONT_SIZE = scaleByDeviceWidth(10);
const TRAIT_DESCRIPTION_LINE_HEIGHT =
  TRAIT_DESCRIPTION_FONT_SIZE * 1.4;
const JOURNEY_BUTTON_WIDTH = scaleByDeviceWidth(153);
const JOURNEY_BUTTON_HEIGHT = scaleByDeviceWidth(42);
const CARD_CONTENT_TOP_GAP = scaleByDeviceWidth(12);
const CARD_FRAME_WIDTH = scaleByDeviceWidth(298);
const CARD_FRAME_HEIGHT = scaleByDeviceWidth(468);
const CARD_IMAGE_WIDTH = scaleByDeviceWidth(226.92);
const CARD_IMAGE_HEIGHT = scaleByDeviceWidth(324.07);
const CARD_IMAGE_TOP_OFFSET = scaleByDeviceWidth(68);
const CARD_ROTATION_DEGREES_PER_POINT = 0.9;
const CARD_NAME_FIELD_TOP_GAP = scaleByDeviceWidth(15.85);
const CARD_NAME_FIELD_WIDTH = scaleByDeviceWidth(308);
const CARD_NAME_FIELD_HEIGHT = scaleByDeviceWidth(40);
const CARD_JOURNEY_BUTTON_TOP_GAP = scaleByDeviceWidth(8);

type CreatureDetailSheetProps = {
  animalId?: number;
  onClose: () => void;
  onReleaseSuccess?: () => Promise<void>;
  width: number;
};

function normalizeCardRotation(rotation: number) {
  return ((rotation + 180) % 360 + 360) % 360 - 180;
}

export function CreatureDetailSheet({
  animalId,
  onClose,
  onReleaseSuccess,
  width,
}: CreatureDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { animal, errorMessage, isLoading, reload } =
    useAnimalDetail(animalId);
  const { isReleasing, releaseAnimal } = useReleaseAnimal();
  const [selectedView, setSelectedView] = useState<'profile' | 'card'>(
    'profile',
  );
  const [isReleaseAlertVisible, setIsReleaseAlertVisible] =
    useState(false);
  const hasDetailContent = animalId === undefined || animal !== null;
  const creatureName =
    animal?.animalName ?? (animalId === undefined ? '꼬미' : '');
  const creatureType = animal
    ? CREATURE_TYPE_NAMES[animal.cardType]
    : CREATURE_TYPE;
  const creatureTier = animal?.tier ?? CREATURE_TIER;
  const creatureTraits = animal
    ? [animal.skill1, animal.skill2]
    : CREATURE_TRAITS;
  const creatureImageSource = animal
    ? animal.animalImageUrl
      ? { uri: animal.animalImageUrl }
      : null
    : animalId === undefined
      ? CREATURE_IMAGE
      : null;
  const creatureCardSource = animal
    ? animal.cardImageUrl
      ? { uri: animal.cardImageUrl }
      : null
    : animalId === undefined
      ? CREATURE_CARD_IMAGE
      : null;
  const creatureCardBackSource = CREATURE_CARD_BACK_IMAGES[
    animal?.cardType ?? 'GROUND'
  ];
  const sheetWidth = width;
  const sheetHeight = sheetWidth / SHEET_ASPECT_RATIO;
  const detailFrameTop = sheetHeight * IMAGE_BOX_TOP_RATIO;
  const detailToggleTop =
    detailFrameTop - DETAIL_TOGGLE_HEIGHT - DETAIL_TOGGLE_GAP;
  const nameFieldTop =
    detailFrameTop + DETAIL_FRAME_HEIGHT + NAME_FIELD_TOP_GAP;
  const detailFieldsRowTop =
    nameFieldTop + FIELD_HEIGHT + DETAIL_FIELDS_ROW_TOP_GAP;
  const firstSkillFieldTop =
    detailFieldsRowTop + FIELD_HEIGHT + SECTION_GAP;
  const secondSkillFieldTop =
    firstSkillFieldTop + SKILL_FIELD_HEIGHT + SECTION_GAP;
  const journeyButtonTop =
    secondSkillFieldTop + SKILL_FIELD_HEIGHT + SECTION_GAP;
  const cardFrameTop =
    detailToggleTop + DETAIL_TOGGLE_HEIGHT + CARD_CONTENT_TOP_GAP;
  const cardNameFieldTop =
    cardFrameTop + CARD_FRAME_HEIGHT + CARD_NAME_FIELD_TOP_GAP;
  const cardJourneyButtonTop =
    cardNameFieldTop +
    CARD_NAME_FIELD_HEIGHT +
    CARD_JOURNEY_BUTTON_TOP_GAP;
  const handleReleaseAnimal = async () => {
    if (animalId === undefined) {
      return;
    }

    try {
      const isReleased = await releaseAnimal(animalId);

      if (isReleased) {
        setIsReleaseAlertVisible(false);
        await onReleaseSuccess?.();
        onClose();
      }
    } catch (error) {
      Alert.alert(
        '여정 보내기 실패',
        error instanceof Error
          ? error.message
          : '동물을 여정 보내지 못했습니다.',
      );
    }
  };
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;
  const cardRotationStartRef = useRef(0);
  const finishCardRotation = (dx: number) => {
    const nextRotation =
      cardRotationStartRef.current +
      dx * CARD_ROTATION_DEGREES_PER_POINT;
    const normalizedRotation = normalizeCardRotation(nextRotation);

    cardRotation.setValue(normalizedRotation);
    cardRotationStartRef.current = normalizedRotation;
  };
  const cardPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        cardRotation.stopAnimation((currentRotation) => {
          cardRotationStartRef.current = currentRotation;
        });
      },
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > scaleByDeviceWidth(3) &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > scaleByDeviceWidth(3) &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        cardRotation.setValue(
          normalizeCardRotation(
            cardRotationStartRef.current +
              gestureState.dx * CARD_ROTATION_DEGREES_PER_POINT,
          ),
        );
      },
      onPanResponderRelease: (_, gestureState) =>
        finishCardRotation(gestureState.dx),
      onPanResponderTerminate: (_, gestureState) =>
        finishCardRotation(gestureState.dx),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  const cardFrontRotateY = cardRotation.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });
  const cardBackRotateY = cardRotation.interpolate({
    inputRange: [-180, 180],
    outputRange: ['0deg', '360deg'],
  });
  const cardFrontOpacity = cardRotation.interpolate({
    inputRange: [-180, -90, -89, 89, 90, 180],
    outputRange: [0, 0, 1, 1, 0, 0],
    extrapolate: 'clamp',
  });
  const cardBackOpacity = cardRotation.interpolate({
    inputRange: [-180, -90, -89, 89, 90, 180],
    outputRange: [1, 1, 0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    translateY.setValue(sheetHeight);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [sheetHeight, translateY]);

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      navigationBarTranslucent={false}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="동물 상세 닫기"
          onPress={onClose}
          style={styles.backdrop}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              width: sheetWidth,
              height: sheetHeight,
              marginBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
        >
          <Image
            resizeMode="contain"
            source={BOTTOM_SHEET_IMAGE}
            style={[
              styles.sheetBackground,
              {
                width: sheetWidth,
                height: sheetHeight,
              },
            ]}
          />

          <View
            style={[
              styles.detailToggle,
              {
                top: detailToggleTop,
                width: DETAIL_TOGGLE_WIDTH,
                height: DETAIL_TOGGLE_HEIGHT,
              },
            ]}
          >
            <Image
              resizeMode="contain"
              source={
                selectedView === 'profile'
                  ? DETAIL_TOGGLE_IMAGE
                  : CARD_DETAIL_TOGGLE_IMAGE
              }
              style={styles.detailToggleImage}
            />
            <View pointerEvents="none" style={styles.detailLabelRow}>
              <Image
                resizeMode="contain"
                source={PROFILE_LABEL_IMAGE}
                style={styles.detailLabel}
              />
              <Image
                resizeMode="contain"
                source={CARD_LABEL_IMAGE}
                style={styles.detailLabel}
              />
            </View>
            <View style={styles.toggleButtonRow}>
              <Pressable
                accessibilityLabel="프로필 보기"
                accessibilityRole="button"
                accessibilityState={{
                  selected: selectedView === 'profile',
                }}
                onPress={() => setSelectedView('profile')}
                style={({ pressed }) => [
                  styles.toggleButton,
                  pressed && styles.pressed,
                ]}
              />
              <Pressable
                accessibilityLabel="카드 보기"
                accessibilityRole="button"
                accessibilityState={{
                  selected: selectedView === 'card',
                }}
                onPress={() => setSelectedView('card')}
                style={({ pressed }) => [
                  styles.toggleButton,
                  pressed && styles.pressed,
                ]}
              />
            </View>
          </View>

          {hasDetailContent && selectedView === 'profile' && (
            <>
              <Image
                accessibilityLabel="동물 상세 프레임"
                resizeMode="contain"
                source={DETAIL_FRAME_IMAGE}
                style={[
                  styles.detailFrame,
                  {
                    top: detailFrameTop,
                    width: DETAIL_FRAME_WIDTH,
                    height: DETAIL_FRAME_HEIGHT,
                  },
                ]}
              />

              <Image
                accessibilityLabel={`${creatureName} 이미지 준비 중`}
                resizeMode="contain"
                source={ANIMAL_IMAGE_PLACEHOLDER}
                style={[
                  styles.creature,
                  {
                    top: detailFrameTop + CREATURE_TOP_OFFSET,
                    width: CREATURE_SIZE,
                    height: CREATURE_SIZE,
                  },
                ]}
              />

              {creatureImageSource && (
                <Image
                  accessibilityLabel={creatureName}
                  resizeMode="contain"
                  source={creatureImageSource}
                  style={[
                    styles.creature,
                    {
                      top: detailFrameTop + CREATURE_TOP_OFFSET,
                      width: CREATURE_SIZE,
                      height: CREATURE_SIZE,
                    },
                  ]}
                />
              )}

              <Image
                resizeMode="contain"
                source={NAME_FIELD_IMAGE}
                style={[
                  styles.nameField,
                  {
                    top: nameFieldTop,
                    width: NAME_FIELD_WIDTH,
                    height: FIELD_HEIGHT,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.nameValue,
                  {
                    top: nameFieldTop,
                    width: NAME_FIELD_WIDTH,
                    height: FIELD_HEIGHT,
                    paddingLeft: NAME_LABEL_WIDTH,
                  },
                ]}
              >
                <Text style={styles.nameValueText}>{creatureName}</Text>
              </View>

              <View
                style={[
                  styles.detailFieldsRow,
                  {
                    top: detailFieldsRowTop,
                    width: NAME_FIELD_WIDTH,
                    height: FIELD_HEIGHT,
                    columnGap: DETAIL_FIELDS_ROW_GAP,
                  },
                ]}
              >
                <View
                  accessibilityLabel={`동물 타입 ${creatureType}`}
                  style={styles.detailField}
                >
                  <Image
                    resizeMode="contain"
                    source={TYPE_FIELD_IMAGE}
                    style={styles.detailFieldBackground}
                  />
                  <View
                    style={[
                      styles.detailFieldValue,
                      { paddingLeft: DETAIL_FIELD_LABEL_WIDTH },
                    ]}
                  >
                    <Text style={styles.detailFieldValueText}>
                      {creatureType}
                    </Text>
                  </View>
                </View>
                <View
                  accessibilityLabel={`동물 티어 ${creatureTier}`}
                  style={styles.detailField}
                >
                  <Image
                    resizeMode="contain"
                    source={TIER_FIELD_IMAGE}
                    style={styles.detailFieldBackground}
                  />
                  <View
                    style={[
                      styles.detailFieldValue,
                      { paddingLeft: DETAIL_FIELD_LABEL_WIDTH },
                    ]}
                  >
                    <Image
                      resizeMode="contain"
                      source={CREATURE_TIER_IMAGES[creatureTier]}
                      style={{
                        width: TIER_IMAGE_WIDTH,
                        height: TIER_IMAGE_HEIGHT,
                      }}
                    />
                  </View>
                </View>
              </View>

              {creatureTraits.map((trait, index) => (
                <View
                  accessibilityLabel={`${trait.name}, ${trait.description}`}
                  key={`${index}-${trait.name}`}
                  style={[
                    styles.skillField,
                    {
                      top:
                        index === 0
                          ? firstSkillFieldTop
                          : secondSkillFieldTop,
                      width: NAME_FIELD_WIDTH,
                      height: SKILL_FIELD_HEIGHT,
                    },
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={SKILL_FIELD_IMAGE}
                    style={styles.skillFieldBackground}
                  />
                  <View style={styles.traitTextContainer}>
                    <Text style={styles.traitName}>{trait.name}</Text>
                    <Text
                      numberOfLines={1}
                      style={styles.traitDescription}
                    >
                      {trait.description}
                    </Text>
                  </View>
                </View>
              ))}

              <Pressable
                accessibilityLabel="새로운 여정 보내기"
                onPress={() => setIsReleaseAlertVisible(true)}
                style={[
                  styles.journeyButton,
                  {
                    top: journeyButtonTop,
                    width: JOURNEY_BUTTON_WIDTH,
                    height: JOURNEY_BUTTON_HEIGHT,
                  },
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={JOURNEY_BUTTON_IMAGE}
                  style={styles.journeyButtonImage}
                />
              </Pressable>
            </>
          )}

          {hasDetailContent && selectedView === 'card' && (
            <>
              <Image
                accessibilityLabel="동물 카드 프레임"
                resizeMode="stretch"
                source={CREATURE_CARD_FRAME_IMAGE}
                style={[
                  styles.cardContent,
                  {
                    top: cardFrameTop,
                    width: CARD_FRAME_WIDTH,
                    height: CARD_FRAME_HEIGHT,
                  },
                ]}
              />

              <View
                {...cardPanResponder.panHandlers}
                accessibilityHint="좌우로 밀어서 카드를 회전할 수 있습니다"
                accessibilityLabel={`${creatureName} 카드`}
                accessible
                style={[
                  styles.creatureCardContainer,
                  {
                    top: cardFrameTop + CARD_IMAGE_TOP_OFFSET,
                    width: CARD_IMAGE_WIDTH,
                    height: CARD_IMAGE_HEIGHT,
                  },
                ]}
              >
                <Animated.Image
                  resizeMode="contain"
                  source={CARD_IMAGE_PLACEHOLDER}
                  style={[
                    styles.creatureCardFace,
                    {
                      width: CARD_IMAGE_WIDTH,
                      height: CARD_IMAGE_HEIGHT,
                      opacity: cardFrontOpacity,
                      transform: [
                        { perspective: scaleByDeviceWidth(800) },
                        { rotateY: cardFrontRotateY },
                      ],
                    },
                  ]}
                />
                {creatureCardSource && (
                  <Animated.Image
                    resizeMode="stretch"
                    source={creatureCardSource}
                    style={[
                      styles.creatureCardFace,
                      {
                        width: CARD_IMAGE_WIDTH,
                        height: CARD_IMAGE_HEIGHT,
                        opacity: cardFrontOpacity,
                        transform: [
                          { perspective: scaleByDeviceWidth(800) },
                          { rotateY: cardFrontRotateY },
                        ],
                      },
                    ]}
                  />
                )}
                <Animated.Image
                  resizeMode="stretch"
                  source={creatureCardBackSource}
                  style={[
                    styles.creatureCardFace,
                    {
                      width: CARD_IMAGE_WIDTH,
                      height: CARD_IMAGE_HEIGHT,
                      opacity: cardBackOpacity,
                      transform: [
                        { perspective: scaleByDeviceWidth(800) },
                        { rotateY: cardBackRotateY },
                      ],
                    },
                  ]}
                />
              </View>

              <Image
                accessibilityLabel="동물 카드 이름"
                resizeMode="stretch"
                source={CREATURE_CARD_NAME_FIELD_IMAGE}
                style={[
                  styles.cardContent,
                  {
                    top: cardNameFieldTop,
                    width: CARD_NAME_FIELD_WIDTH,
                    height: CARD_NAME_FIELD_HEIGHT,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.nameValue,
                  {
                    top: cardNameFieldTop,
                    width: CARD_NAME_FIELD_WIDTH,
                    height: CARD_NAME_FIELD_HEIGHT,
                    paddingLeft: NAME_LABEL_WIDTH,
                  },
                ]}
              >
                <Text style={styles.nameValueText}>{creatureName}</Text>
              </View>

              <Pressable
                accessibilityLabel="새로운 여정 보내기"
                onPress={() => setIsReleaseAlertVisible(true)}
                style={[
                  styles.journeyButton,
                  {
                    top: cardJourneyButtonTop,
                    width: JOURNEY_BUTTON_WIDTH,
                    height: JOURNEY_BUTTON_HEIGHT,
                  },
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={JOURNEY_BUTTON_IMAGE}
                  style={styles.journeyButtonImage}
                />
              </Pressable>
            </>
          )}

          {animalId !== undefined && isLoading && (
            <View style={styles.requestState}>
              <ActivityIndicator color="#8B6B3F" size="large" />
              <Text style={styles.requestStateText}>
                동물 정보를 불러오는 중...
              </Text>
            </View>
          )}

          {animalId !== undefined && errorMessage && !isLoading && (
            <View style={styles.requestState}>
              <Text style={styles.requestStateText}>{errorMessage}</Text>
              <Pressable
                accessibilityLabel="동물 상세 다시 불러오기"
                accessibilityRole="button"
                onPress={() => void reload()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
        {isReleaseAlertVisible && (
          <ReleaseCreatureAlert
            isConfirming={isReleasing}
            onClose={() => setIsReleaseAlertVisible(false)}
            onConfirm={
              animalId === undefined
                ? undefined
                : () => void handleReleaseAnimal()
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(36, 29, 21, 0.42)',
  },
  sheet: {
    overflow: 'hidden',
  },
  sheetBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  requestState: {
    position: 'absolute',
    top: '32%',
    alignSelf: 'center',
    alignItems: 'center',
    width: scaleByDeviceWidth(300),
    gap: scaleByDeviceWidth(12),
  },
  requestStateText: {
    color: '#685A48',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
    textAlign: 'center',
  },
  retryButton: {
    minWidth: scaleByDeviceWidth(96),
    height: scaleByDeviceWidth(40),
    paddingHorizontal: scaleByDeviceWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleByDeviceWidth(10),
    backgroundColor: '#365D20',
  },
  retryButtonText: {
    color: '#FFF9F0',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(14),
  },
  detailToggle: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
  },
  detailToggleImage: {
    width: DETAIL_TOGGLE_WIDTH,
    height: DETAIL_TOGGLE_HEIGHT,
  },
  detailLabelRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  detailLabel: {
    width: scaleByDeviceWidth(88),
    height: scaleByDeviceWidth(17),
  },
  toggleButtonRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  toggleButton: {
    flex: 1,
  },
  detailFrame: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  cardContent: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  creatureCardContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 2,
  },
  creatureCardFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  creature: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
  },
  nameField: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  nameValue: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameValueText: {
    color: '#745D40',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  detailFieldsRow: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  detailField: {
    width: DETAIL_FIELD_WIDTH,
    height: FIELD_HEIGHT,
  },
  detailFieldBackground: {
    ...StyleSheet.absoluteFillObject,
    width: DETAIL_FIELD_WIDTH,
    height: FIELD_HEIGHT,
  },
  detailFieldValue: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailFieldValueText: {
    color: '#745D40',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  skillField: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
  },
  skillFieldBackground: {
    ...StyleSheet.absoluteFillObject,
    width: NAME_FIELD_WIDTH,
    height: SKILL_FIELD_HEIGHT,
  },
  traitTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: scaleByDeviceWidth(17),
    rowGap: TRAIT_TEXT_GAP,
  },
  traitName: {
    color: '#684500',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: TRAIT_NAME_FONT_SIZE,
    lineHeight: TRAIT_NAME_LINE_HEIGHT,
    includeFontPadding: false,
  },
  traitDescription: {
    color: '#684500',
    fontFamily: 'EliceDXNeolli-Light',
    fontSize: TRAIT_DESCRIPTION_FONT_SIZE,
    lineHeight: TRAIT_DESCRIPTION_LINE_HEIGHT,
    includeFontPadding: false,
  },
  journeyButton: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
  },
  journeyButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.75,
  },
});
