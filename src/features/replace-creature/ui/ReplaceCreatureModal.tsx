import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useState } from 'react';

import type { FarmAnimal } from '@/src/entities/farm';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const MODAL_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-modal.png');
const TEXT_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-text.png');
const CARD_PLACEHOLDER_IMAGE = require('@/src/shared/assets/images/farm/card-image-placeholder.png');
const CAPTURED_CARD_IMAGE = require('@/src/shared/assets/images/farm/kkomi-card.png');
const REPLACE_ICON_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-icon.png');
const BEFORE_LABEL_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-before-label.png');
const AFTER_LABEL_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-after-label.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-cancel-button.png');
const CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/replace-creature-confirm-button.png');
const MODAL_WIDTH = scaleByDeviceWidth(324);
const MODAL_HEIGHT = MODAL_WIDTH * (1640 / 1296);
const TEXT_WIDTH = scaleByDeviceWidth(239);
const TEXT_HEIGHT = TEXT_WIDTH * (256 / 956);
const TEXT_TOP = scaleByDeviceWidth(30);
const TEXT_CARD_GAP = scaleByDeviceWidth(24);
const CARD_WIDTH = scaleByDeviceWidth(110.03);
const CARD_HEIGHT = scaleByDeviceWidth(155);
const CARD_GAP = scaleByDeviceWidth(37.71);
const REPLACE_ICON_WIDTH = scaleByDeviceWidth(21.71);
const REPLACE_ICON_HEIGHT = scaleByDeviceWidth(24.71);
const CARD_LABEL_GAP = scaleByDeviceWidth(8);
const CARD_LABEL_WIDTH = scaleByDeviceWidth(39);
const CARD_LABEL_HEIGHT = scaleByDeviceWidth(17);
const LABEL_BUTTON_GAP = scaleByDeviceWidth(24);
const BUTTON_WIDTH = scaleByDeviceWidth(148);
const BUTTON_HEIGHT = scaleByDeviceWidth(54);
const BUTTON_GAP = scaleByDeviceWidth(4);
const CLOSE_SIZE = scaleByDeviceWidth(40);

type ReplaceCreatureModalProps = {
  animal: FarmAnimal | null;
  capturedCardImageUrl?: string;
  isConfirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ReplaceCreatureModal({
  animal,
  capturedCardImageUrl,
  isConfirming,
  onClose,
  onConfirm,
}: ReplaceCreatureModalProps) {
  const [failedExistingCardUri, setFailedExistingCardUri] =
    useState<string | null>(null);
  const [failedCapturedCardUri, setFailedCapturedCardUri] =
    useState<string | null>(null);
  const existingCardUri = animal?.cardImageUrl ?? null;
  const hasExistingCardFailed =
    existingCardUri !== null && failedExistingCardUri === existingCardUri;
  const hasCapturedCardFailed =
    capturedCardImageUrl !== undefined &&
    failedCapturedCardUri === capturedCardImageUrl;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={animal !== null}
    >
      <View
        accessibilityLabel="기존 동물 교체"
        accessibilityViewIsModal
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <Image
            resizeMode="contain"
            source={MODAL_IMAGE}
            style={styles.modalImage}
          />
          <Image
            accessibilityLabel="정말 이 동물과 교체하시겠어요? 동물을 교체하면 기존 동물은 자연으로 돌아가요"
            resizeMode="contain"
            source={TEXT_IMAGE}
            style={styles.textImage}
          />
          <View style={styles.cardRow}>
            <View style={styles.cardColumn}>
              <View style={styles.card}>
                <Image
                  accessibilityLabel="교체할 기존 동물 카드"
                  resizeMode="contain"
                  source={CARD_PLACEHOLDER_IMAGE}
                  style={styles.cardImage}
                />
                {existingCardUri && !hasExistingCardFailed && (
                  <Image
                    accessibilityLabel={`${animal?.animalName ?? '기존 동물'} 카드`}
                    defaultSource={CARD_PLACEHOLDER_IMAGE}
                    onError={() => setFailedExistingCardUri(existingCardUri)}
                    resizeMode="contain"
                    source={{ uri: existingCardUri }}
                    style={styles.cardImageOverlay}
                  />
                )}
              </View>
              <Image
                accessibilityLabel="변경 전"
                resizeMode="contain"
                source={BEFORE_LABEL_IMAGE}
                style={styles.cardLabel}
              />
            </View>
            <View style={styles.cardColumn}>
              <Image
                accessibilityLabel="새로 포착한 동물 카드"
                defaultSource={CAPTURED_CARD_IMAGE}
                onError={() => {
                  if (capturedCardImageUrl) {
                    setFailedCapturedCardUri(capturedCardImageUrl);
                  }
                }}
                resizeMode="contain"
                source={
                  capturedCardImageUrl && !hasCapturedCardFailed
                    ? { uri: capturedCardImageUrl }
                    : CAPTURED_CARD_IMAGE
                }
                style={styles.card}
              />
              <Image
                accessibilityLabel="변경 후"
                resizeMode="contain"
                source={AFTER_LABEL_IMAGE}
                style={styles.cardLabel}
              />
            </View>
            <Image
              accessibilityLabel="동물 교체"
              resizeMode="contain"
              source={REPLACE_ICON_IMAGE}
              style={styles.replaceIcon}
            />
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              accessibilityLabel="동물 교체 취소하기"
              accessibilityRole="button"
              disabled={isConfirming}
              onPress={onClose}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={CANCEL_BUTTON_IMAGE}
                style={styles.actionButtonImage}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="동물 교체하기"
              accessibilityRole="button"
              disabled={isConfirming}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                (pressed || isConfirming) && styles.pressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={CONFIRM_BUTTON_IMAGE}
                style={styles.actionButtonImage}
              />
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="동물 교체창 닫기"
            accessibilityRole="button"
            disabled={isConfirming}
            hitSlop={scaleByDeviceWidth(8)}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 18, 23, 0.68)',
  },
  modal: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  modalImage: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
  },
  textImage: {
    position: 'absolute',
    top: TEXT_TOP,
    alignSelf: 'center',
    width: TEXT_WIDTH,
    height: TEXT_HEIGHT,
  },
  cardRow: {
    position: 'absolute',
    top: TEXT_TOP + TEXT_HEIGHT + TEXT_CARD_GAP,
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: CARD_GAP,
  },
  cardColumn: {
    width: CARD_WIDTH,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImageOverlay: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  replaceIcon: {
    position: 'absolute',
    top: (CARD_HEIGHT - REPLACE_ICON_HEIGHT) / 2,
    left: CARD_WIDTH + (CARD_GAP - REPLACE_ICON_WIDTH) / 2,
    width: REPLACE_ICON_WIDTH,
    height: REPLACE_ICON_HEIGHT,
  },
  cardLabel: {
    width: CARD_LABEL_WIDTH,
    height: CARD_LABEL_HEIGHT,
    marginTop: CARD_LABEL_GAP,
  },
  buttonRow: {
    position: 'absolute',
    top:
      TEXT_TOP +
      TEXT_HEIGHT +
      TEXT_CARD_GAP +
      CARD_HEIGHT +
      CARD_LABEL_GAP +
      CARD_LABEL_HEIGHT +
      LABEL_BUTTON_GAP,
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: BUTTON_GAP,
  },
  actionButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  actionButtonImage: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    right: scaleByDeviceWidth(4),
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
  },
  pressed: {
    opacity: 0.55,
  },
});
