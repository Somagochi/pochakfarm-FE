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
const KKOMI_IMAGE = require('@/src/shared/assets/images/farm/kkomi.png');
const JOURNEY_LABEL_IMAGE = require('@/src/shared/assets/images/farm/creature-journey-label.png');
const SHEET_ASPECT_RATIO = 1440 / 2756;
const DETAIL_TOGGLE_WIDTH = scaleByDeviceWidth(218);
const DETAIL_TOGGLE_HEIGHT = scaleByDeviceWidth(35);
const IMAGE_BOX_TOP_RATIO = 340 / 2756;
const DETAIL_TOGGLE_GAP = scaleByDeviceWidth(12);
const JOURNEY_LABEL_WIDTH = scaleByDeviceWidth(99);
const JOURNEY_LABEL_HEIGHT = JOURNEY_LABEL_WIDTH * (42 / 388);

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
                top:
                  sheetHeight * IMAGE_BOX_TOP_RATIO -
                  DETAIL_TOGGLE_HEIGHT -
                  DETAIL_TOGGLE_GAP,
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
            accessibilityLabel="꼬미"
            resizeMode="contain"
            source={KKOMI_IMAGE}
            style={[
              styles.creature,
              {
                top: sheetHeight * 0.27,
                width: sheetWidth * 0.43,
                height: sheetWidth * 0.43,
              },
            ]}
          />

          <View
            style={[
              styles.nameValue,
              {
                top: sheetHeight * 0.555,
                left: sheetWidth * 0.35,
                width: sheetWidth * 0.58,
                height: sheetHeight * 0.055,
              },
            ]}
          >
            <Text style={styles.valueText}>꼬미</Text>
          </View>

          <View
            style={[
              styles.typeValue,
              {
                top: sheetHeight * 0.624,
                left: sheetWidth * 0.265,
                width: sheetWidth * 0.225,
                height: sheetHeight * 0.055,
              },
            ]}
          >
            <Text style={styles.smallValueText}>포유류</Text>
          </View>

          <View
            style={[
              styles.tierValue,
              {
                top: sheetHeight * 0.624,
                left: sheetWidth * 0.705,
                width: sheetWidth * 0.225,
                height: sheetHeight * 0.055,
              },
            ]}
          >
            <Text style={styles.smallValueText}>희귀</Text>
          </View>

          <View
            style={[
              styles.skillContent,
              {
                top: sheetHeight * 0.695,
                left: sheetWidth * 0.085,
                width: sheetWidth * 0.83,
                height: sheetHeight * 0.08,
              },
            ]}
          >
            <Text style={styles.skillName}>말랑한 친구</Text>
            <Text numberOfLines={1} style={styles.skillDescription}>
              포근한 매력으로 주변 친구들의 기분을 좋게 해줘요.
            </Text>
          </View>

          <View
            style={[
              styles.skillContent,
              {
                top: sheetHeight * 0.792,
                left: sheetWidth * 0.085,
                width: sheetWidth * 0.83,
                height: sheetHeight * 0.08,
              },
            ]}
          >
            <Text style={styles.skillName}>행운의 발걸음</Text>
            <Text numberOfLines={1} style={styles.skillDescription}>
              농장을 산책하며 작은 행운과 보상을 찾아줘요.
            </Text>
          </View>

          <Image
            accessibilityLabel="새로운 여정 보내기"
            resizeMode="contain"
            source={JOURNEY_LABEL_IMAGE}
            style={[
              styles.journeyLabel,
              {
                top:
                  sheetHeight * 0.919 -
                  JOURNEY_LABEL_HEIGHT / 2,
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
  creature: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  nameValue: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeValue: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierValue: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: '#745D40',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(16),
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  smallValueText: {
    color: '#745D40',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(16),
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  skillContent: {
    position: 'absolute',
    justifyContent: 'center',
    paddingHorizontal: scaleByDeviceWidth(12),
  },
  skillName: {
    color: '#654300',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(16),
    includeFontPadding: false,
    lineHeight: scaleByDeviceWidth(19),
    textAlignVertical: 'center',
  },
  skillDescription: {
    color: '#654300',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    includeFontPadding: false,
    lineHeight: scaleByDeviceWidth(15),
    textAlignVertical: 'center',
  },
  journeyLabel: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    width: JOURNEY_LABEL_WIDTH,
    height: JOURNEY_LABEL_HEIGHT,
  },
  pressed: {
    opacity: 0.75,
  },
});
