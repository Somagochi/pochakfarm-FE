import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BOTTOM_SHEET_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-bottom-sheet.png');
const DETAIL_TOGGLE_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-toggle.png');
const PROFILE_LABEL_IMAGE = require('@/src/shared/assets/images/farm/creature-profile-label.png');
const CARD_LABEL_IMAGE = require('@/src/shared/assets/images/farm/creature-card-label.png');
const DETAIL_FRAME_IMAGE = require('@/src/shared/assets/images/farm/creature-detail-frame.png');
const CREATURE_IMAGE = require('@/src/shared/assets/images/farm/kkomi.png');
const NAME_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-name-field.png');
const TYPE_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-type-field.png');
const TIER_FIELD_IMAGE = require('@/src/shared/assets/images/farm/creature-tier-field.png');
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
const DETAIL_FIELDS_ROW_GAP = scaleByDeviceWidth(12);
const SECTION_GAP = scaleByDeviceWidth(8);
const SKILL_FIELD_HEIGHT = scaleByDeviceWidth(60.42);
const JOURNEY_BUTTON_WIDTH = scaleByDeviceWidth(153);
const JOURNEY_BUTTON_HEIGHT = scaleByDeviceWidth(42);

type CreatureDetailSheetProps = {
  onClose: () => void;
  width: number;
};

export function CreatureDetailSheet({
  onClose,
  width,
}: CreatureDetailSheetProps) {
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
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

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

          <Pressable
            accessibilityLabel="동물 정보 보기"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.detailToggle,
              {
                top: detailToggleTop,
                width: DETAIL_TOGGLE_WIDTH,
                height: DETAIL_TOGGLE_HEIGHT,
              },
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={DETAIL_TOGGLE_IMAGE}
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
          </Pressable>

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
            accessibilityLabel="꼬미"
            resizeMode="contain"
            source={CREATURE_IMAGE}
            style={[
              styles.creature,
              {
                top: detailFrameTop + CREATURE_TOP_OFFSET,
                width: CREATURE_SIZE,
                height: CREATURE_SIZE,
              },
            ]}
          />

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
            <Text style={styles.nameValueText}>꼬미</Text>
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
            <Image
              accessibilityLabel="동물 타입"
              resizeMode="contain"
              source={TYPE_FIELD_IMAGE}
              style={styles.detailField}
            />
            <Image
              accessibilityLabel="동물 티어"
              resizeMode="contain"
              source={TIER_FIELD_IMAGE}
              style={styles.detailField}
            />
          </View>

          <Image
            accessibilityLabel="첫 번째 동물 스킬"
            resizeMode="contain"
            source={SKILL_FIELD_IMAGE}
            style={[
              styles.skillField,
              {
                top: firstSkillFieldTop,
                width: NAME_FIELD_WIDTH,
                height: SKILL_FIELD_HEIGHT,
              },
            ]}
          />

          <Image
            accessibilityLabel="두 번째 동물 스킬"
            resizeMode="contain"
            source={SKILL_FIELD_IMAGE}
            style={[
              styles.skillField,
              {
                top: secondSkillFieldTop,
                width: NAME_FIELD_WIDTH,
                height: SKILL_FIELD_HEIGHT,
              },
            ]}
          />

          <Image
            accessibilityLabel="새로운 여정 보내기"
            resizeMode="contain"
            source={JOURNEY_BUTTON_IMAGE}
            style={[
              styles.journeyButton,
              {
                top: journeyButtonTop,
                width: JOURNEY_BUTTON_WIDTH,
                height: JOURNEY_BUTTON_HEIGHT,
              },
            ]}
          />
        </Animated.View>
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
  detailFrame: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
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
    fontFamily: 'EliceDXNeolli-Bold',
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
  skillField: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
  },
  journeyButton: {
    position: 'absolute',
    zIndex: 1,
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
