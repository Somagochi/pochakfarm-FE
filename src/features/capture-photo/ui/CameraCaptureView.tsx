import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  getLevelProgress,
  getRemainingExpForNextLevel,
  MAX_USER_LEVEL,
} from '@/src/entities/user';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptureGame } from './CaptureGame';

const CLOSE_IMAGE = require('@/src/shared/assets/images/capture/capture-close.png');
const CAPTURE_TITLE_IMAGE = require('@/src/shared/assets/images/capture/capture-title.png');
const REMAINING_COUNT_IMAGE = require('@/src/shared/assets/images/capture/remaining-count.png');
const CAPTURE_GUIDE_IMAGES = [
  require('@/src/shared/assets/images/capture/capture-guide-angle.png'),
  require('@/src/shared/assets/images/capture/capture-guide-subject.png'),
  require('@/src/shared/assets/images/capture/capture-guide-copyright.png'),
] as const;
const ALBUM_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/album-button.png');
const HELP_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/help-button.png');
const SHUTTER_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/shutter-button.png');
const CAPTURE_LIMIT_IMAGE = require('@/src/shared/assets/images/capture/capture-limit.png');
const CAPTURE_COIN_DIALOG_IMAGE = require('@/src/shared/assets/images/capture/capture-coin-dialog.png');
const CAMERA_PERMISSION_DIALOG_IMAGE = require('@/src/shared/assets/images/capture/camera-permission-dialog.png');
const CAPTURE_PROBABILITY_MODAL_IMAGE = require('@/src/shared/assets/images/capture/capture-probability-modal.png');
const CAMERA_PERMISSION_TOAST_IMAGE = require('@/src/shared/assets/images/capture/camera-permission-toast.png');
const CAMERA_BRAND_IMAGE = require('@/src/shared/assets/images/capture/camera-brand.png');
const CAMERA_CARD_ASPECT_RATIO = 426 / 656;
const CAMERA_CARD_HORIZONTAL_MARGIN = scaleByDeviceWidth(11);
const CAMERA_CARD_BUTTON_GAP = scaleByDeviceWidth(24);
const BOTTOM_BUTTON_SIZE = scaleByDeviceWidth(64);
const MAX_CAPTURE_COUNT = 5;
const PAID_CAPTURE_SESSION_COST = 200;
const MOCK_INITIAL_COIN_BALANCE = 12500;
const HELP_MODAL_REFERENCE_WIDTH = 328;
const HELP_MODAL_REFERENCE_HEIGHT = 626;
const MOCK_USER_LEVEL = 1;
const MOCK_USER_EXP = 31;
const MOCK_CAPTURE_COUNTS = [
  { color: '#E9B400', count: 23, label: '하늘' },
  { color: '#2F7D35', count: 8, label: '땅' },
  { color: '#2185A8', count: 15, label: '바다' },
  { color: '#4A38A7', count: 3, label: '우주' },
] as const;

export function CameraCaptureView() {
  const { height: screenHeight, width: screenWidth } =
    useWindowDimensions();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [guideIndex, setGuideIndex] = useState(0);
  const [remainingCaptureCount, setRemainingCaptureCount] =
    useState(MAX_CAPTURE_COUNT);
  const [coinBalance, setCoinBalance] = useState(
    MOCK_INITIAL_COIN_BALANCE,
  );
  const [isPaidCaptureSessionActive, setIsPaidCaptureSessionActive] =
    useState(false);
  const [isCoinDialogVisible, setIsCoinDialogVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [isPermissionToastVisible, setIsPermissionToastVisible] =
    useState(false);
  const permissionToastOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const cameraCardTop = insets.top + scaleByDeviceWidth(117);
  const bottomControlsTop =
    screenHeight -
    insets.bottom -
    scaleByDeviceWidth(28) -
    BOTTOM_BUTTON_SIZE;
  const availableCameraCardHeight =
    bottomControlsTop - cameraCardTop - CAMERA_CARD_BUTTON_GAP;
  const cameraCardWidth = Math.min(
    screenWidth - CAMERA_CARD_HORIZONTAL_MARGIN * 2,
    availableCameraCardHeight * CAMERA_CARD_ASPECT_RATIO,
  );
  const helpModalScale = Math.min(
    screenWidth / 411,
    (screenHeight * 0.92) / HELP_MODAL_REFERENCE_HEIGHT,
  );
  const helpModalWidth =
    HELP_MODAL_REFERENCE_WIDTH * helpModalScale;
  const helpModalHeight =
    HELP_MODAL_REFERENCE_HEIGHT * helpModalScale;
  const remainingExp = getRemainingExpForNextLevel(
    MOCK_USER_LEVEL,
    MOCK_USER_EXP,
  );
  const levelProgress = getLevelProgress(
    MOCK_USER_LEVEL,
    MOCK_USER_EXP,
  );
  const isMaxLevel = MOCK_USER_LEVEL >= MAX_USER_LEVEL;
  const hasCaptureOpportunity =
    remainingCaptureCount > 0 || isPaidCaptureSessionActive;

  useEffect(() => {
    const guideTimer = setInterval(() => {
      setGuideIndex(
        (currentIndex) =>
          (currentIndex + 1) % CAPTURE_GUIDE_IMAGES.length,
      );
    }, 3000);

    return () => clearInterval(guideTimer);
  }, []);

  useEffect(() => {
    if (!isPermissionToastVisible || !permission?.granted) {
      return;
    }

    permissionToastOpacity.setValue(0);

    const toastAnimation = Animated.sequence([
      Animated.timing(permissionToastOpacity, {
        duration: 200,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(permissionToastOpacity, {
        duration: 200,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    toastAnimation.start(({ finished }) => {
      if (finished) {
        setIsPermissionToastVisible(false);
      }
    });

    return () => toastAnimation.stop();
  }, [
    isPermissionToastVisible,
    permission?.granted,
    permissionToastOpacity,
  ]);

  const handleRequestPermission = async () => {
    const nextPermission = await requestPermission();

    if (nextPermission.granted) {
      setIsPermissionToastVisible(true);
    }
  };

  const consumeCaptureOpportunity = () => {
    if (remainingCaptureCount > 0) {
      setRemainingCaptureCount((currentCount) =>
        Math.max(0, currentCount - 1),
      );
      return;
    }

    if (isPaidCaptureSessionActive) {
      setCoinBalance((currentBalance) =>
        Math.max(0, currentBalance - PAID_CAPTURE_SESSION_COST),
      );
      setIsPaidCaptureSessionActive(false);
    }
  };

  const handleCapture = async () => {
    if (
      !cameraRef.current ||
      isCapturing ||
      !hasCaptureOpportunity
    ) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      if (photo?.uri) {
        consumeCaptureOpportunity();
        setCapturedPhotoUri(photo.uri);
      }
    } catch {
      Alert.alert('촬영 실패', '사진을 촬영하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSelectPhoto = async () => {
    if (isSelectingPhoto || !hasCaptureOpportunity) {
      return;
    }

    setIsSelectingPhoto(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      const selectedPhoto = result.assets?.[0];

      if (!result.canceled && selectedPhoto?.uri) {
        consumeCaptureOpportunity();
        setCapturedPhotoUri(selectedPhoto.uri);
      }
    } catch {
      Alert.alert(
        '사진 선택 실패',
        '앨범에서 사진을 불러오지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsSelectingPhoto(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color="#31533B" size="large" />
      </View>
    );
  }

  const handleUseCoins = () => {
    if (coinBalance < PAID_CAPTURE_SESSION_COST) {
      setIsCoinDialogVisible(false);
      Alert.alert('코인이 부족해요', '포착에는 200코인이 필요해요.');
      return;
    }

    setIsPaidCaptureSessionActive(true);
    setIsCoinDialogVisible(false);
  };

  if (!permission.granted) {
    return (
      <View style={styles.permissionModalScreen}>
        <View style={styles.permissionDimOverlay}>
          <View style={styles.permissionDialog}>
            <Image
              accessibilityLabel="카메라 접근이 필요해요"
              resizeMode="contain"
              source={CAMERA_PERMISSION_DIALOG_IMAGE}
              style={styles.permissionDialogImage}
            />
            <Pressable
              accessibilityLabel="카메라 권한 안내 닫기"
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/farm')}
              style={styles.permissionDialogCloseButton}
            />
            <Pressable
              accessibilityLabel="카메라 권한 허용하기"
              accessibilityRole="button"
              onPress={handleRequestPermission}
              style={styles.permissionDialogAllowButton}
            />
          </View>
        </View>
      </View>
    );
  }

  if (capturedPhotoUri) {
    return (
      <CaptureGame
        onClose={() => router.replace('/(tabs)/farm')}
        onRetry={() => setCapturedPhotoUri(null)}
        photoUri={capturedPhotoUri}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.captureHeader,
          { top: insets.top + scaleByDeviceWidth(8) },
        ]}
      >
        <Pressable
          accessibilityLabel="카메라 닫기"
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/farm')}
          style={({ pressed }) => pressed && styles.buttonPressed}
        >
          <Image
            resizeMode="contain"
            source={CLOSE_IMAGE}
            style={styles.closeImage}
          />
        </Pressable>

        <View pointerEvents="none" style={styles.captureTitleSlot}>
          <Image
            accessibilityLabel="포착하기"
            resizeMode="contain"
            source={CAPTURE_TITLE_IMAGE}
            style={styles.captureTitleImage}
          />
        </View>

        <View
          accessibilityLabel={`남은횟수 ${remainingCaptureCount} / ${MAX_CAPTURE_COUNT}`}
          style={styles.remainingCountGroup}
        >
          <Image
            resizeMode="contain"
            source={REMAINING_COUNT_IMAGE}
            style={styles.remainingCountImage}
          />
          <Text style={styles.remainingCountText}>
            {remainingCaptureCount} / {MAX_CAPTURE_COUNT}
          </Text>
        </View>
      </View>

      <Image
        accessibilityLabel="촬영 가이드"
        resizeMode="contain"
        source={CAPTURE_GUIDE_IMAGES[guideIndex]}
        style={[
          styles.guideImage,
          { top: insets.top + scaleByDeviceWidth(67) },
        ]}
      />

      <View
        style={[
          styles.cameraCard,
          {
            top: cameraCardTop,
            width: cameraCardWidth,
          },
        ]}
      >
        <View style={styles.cameraBezel}>
          <View style={styles.cameraViewport}>
            <CameraView
              animateShutter={false}
              facing="back"
              flash="off"
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.dimOverlay} pointerEvents="none" />
            {hasCaptureOpportunity && (
              <View pointerEvents="none" style={styles.focusFrame}>
                <View style={[styles.corner, styles.topLeftCorner]} />
                <View style={[styles.corner, styles.topRightCorner]} />
                <View style={[styles.corner, styles.bottomLeftCorner]} />
                <View style={[styles.corner, styles.bottomRightCorner]} />
              </View>
            )}
            {!hasCaptureOpportunity && (
              <View style={styles.captureLimitOverlay}>
                <View style={styles.captureLimitContent}>
                  <Image
                    accessibilityLabel="오늘의 포착 기회를 모두 사용했어요"
                    resizeMode="contain"
                    source={CAPTURE_LIMIT_IMAGE}
                    style={styles.captureLimitImage}
                  />
                  <Pressable
                    accessibilityLabel="200코인으로 포착하기"
                    accessibilityRole="button"
                    onPress={() => setIsCoinDialogVisible(true)}
                    style={({ pressed }) => [
                      styles.captureLimitButton,
                      pressed && styles.buttonPressed,
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
          <Image
            resizeMode="contain"
            source={CAMERA_BRAND_IMAGE}
            style={styles.cameraBrand}
          />
        </View>
      </View>

      <View
        style={[
          styles.bottomControls,
          {
            bottom: insets.bottom + scaleByDeviceWidth(28),
          },
        ]}
      >
        <Pressable
          accessibilityLabel="앨범에서 사진 선택"
          accessibilityRole="button"
          disabled={
            isSelectingPhoto || !hasCaptureOpportunity
          }
          onPress={handleSelectPhoto}
          style={({ pressed }) => [
            styles.albumButton,
            (pressed || isSelectingPhoto) && styles.buttonPressed,
            !hasCaptureOpportunity && styles.disabledButton,
          ]}
        >
          <Image
            resizeMode="contain"
            source={ALBUM_BUTTON_IMAGE}
            style={styles.albumButtonImage}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="사진 촬영"
          accessibilityRole="button"
          disabled={isCapturing || !hasCaptureOpportunity}
          onPress={handleCapture}
          style={({ pressed }) => [
            styles.shutterButton,
            (pressed || isCapturing) && styles.buttonPressed,
            !hasCaptureOpportunity && styles.disabledButton,
          ]}
        >
          <Image
            resizeMode="contain"
            source={SHUTTER_BUTTON_IMAGE}
            style={styles.shutterButtonImage}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="촬영 도움말"
          accessibilityRole="button"
          onPress={() => setIsHelpModalVisible(true)}
          style={({ pressed }) => [
            styles.helpButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={HELP_BUTTON_IMAGE}
            style={styles.helpButtonImage}
          />
        </Pressable>
      </View>

      {isPermissionToastVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.permissionToast,
            {
              bottom: insets.bottom + scaleByDeviceWidth(108),
              opacity: permissionToastOpacity,
            },
          ]}
        >
          <Image
            accessibilityLabel="카메라 접근을 허용했습니다."
            resizeMode="contain"
            source={CAMERA_PERMISSION_TOAST_IMAGE}
            style={styles.permissionToastImage}
          />
        </Animated.View>
      )}

      {isCoinDialogVisible && (
        <View style={styles.dialogOverlay}>
          <View style={styles.coinDialog}>
            <Image
              accessibilityLabel="200코인으로 포착 기회를 추가할까요?"
              resizeMode="contain"
              source={CAPTURE_COIN_DIALOG_IMAGE}
              style={styles.coinDialogImage}
            />
            <Pressable
              accessibilityLabel="닫기"
              accessibilityRole="button"
              onPress={() => setIsCoinDialogVisible(false)}
              style={styles.dialogCloseButton}
            />
            <Pressable
              accessibilityLabel="취소하기"
              accessibilityRole="button"
              onPress={() => setIsCoinDialogVisible(false)}
              style={styles.dialogCancelButton}
            />
            <Pressable
              accessibilityLabel="200코인 사용"
              accessibilityRole="button"
              onPress={handleUseCoins}
              style={styles.dialogConfirmButton}
            />
          </View>
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setIsHelpModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isHelpModalVisible}
      >
        <View style={styles.helpModalOverlay}>
          <View
            style={[
              styles.helpModal,
              {
                width: helpModalWidth,
                height: helpModalHeight,
              },
            ]}
          >
            <Image
              accessibilityLabel="내 포착 확률 보기"
              resizeMode="contain"
              source={CAPTURE_PROBABILITY_MODAL_IMAGE}
              style={{
                width: helpModalWidth,
                height: helpModalHeight,
              }}
            />
            <Text
              accessibilityLabel={`현재 레벨 ${MOCK_USER_LEVEL}`}
              style={[
                styles.helpModalLevel,
                {
                  top: 199 * helpModalScale,
                  left: 32 * helpModalScale,
                  width: 39 * helpModalScale,
                  fontSize: 13 * helpModalScale,
                },
              ]}
            >
              {MOCK_USER_LEVEL}
            </Text>
            <Text
              accessibilityLabel={
                isMaxLevel
                  ? '최고 레벨에 도달했어요'
                  : `다음 레벨까지 ${remainingExp} EXP 남았어요`
              }
              style={[
                styles.helpModalProgressMessage,
                {
                  top: 191 * helpModalScale,
                  left: 90 * helpModalScale,
                  width: 192.75 * helpModalScale,
                  fontSize: 8 * helpModalScale,
                  lineHeight: 11 * helpModalScale,
                },
              ]}
            >
              {isMaxLevel ? (
                '최고 레벨에 도달했어요'
              ) : (
                <>
                  다음 레벨까지{' '}
                  <Text style={styles.helpModalProgressHighlight}>
                    {remainingExp} EXP
                  </Text>{' '}
                  남았어요
                </>
              )}
            </Text>
            <View
              accessibilityLabel={`현재 경험치 ${Math.round(levelProgress * 100)}퍼센트`}
              style={[
                styles.helpModalProgressTrack,
                {
                  top: 211 * helpModalScale,
                  left: 90 * helpModalScale,
                  width: 192.75 * helpModalScale,
                  height: 8 * helpModalScale,
                  borderRadius: 4 * helpModalScale,
                },
              ]}
            >
              <View
                style={[
                  styles.helpModalProgressFill,
                  {
                    width: `${levelProgress * 100}%`,
                    borderRadius: 4 * helpModalScale,
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.helpModalCaptureCounts,
                {
                  top: 394 * helpModalScale,
                  left: 31 * helpModalScale,
                  width: 265 * helpModalScale,
                  height: 18 * helpModalScale,
                },
              ]}
            >
              {MOCK_CAPTURE_COUNTS.map(
                ({ color, count, label }) => (
                  <Text
                    accessibilityLabel={`${label} 타입 ${count}번 포착`}
                    key={label}
                    style={[
                      styles.helpModalCaptureCount,
                      {
                        color,
                        width: 66.25 * helpModalScale,
                        fontSize: 14 * helpModalScale,
                        lineHeight: 17 * helpModalScale,
                      },
                    ]}
                  >
                    {count}
                    <Text
                      style={[
                        styles.helpModalCaptureCountUnit,
                        { fontSize: 9 * helpModalScale },
                      ]}
                    >
                      번
                    </Text>
                  </Text>
                ),
              )}
            </View>
            <Pressable
              accessibilityLabel="포착 확률 안내 닫기"
              accessibilityRole="button"
              onPress={() => setIsHelpModalVisible(false)}
              style={[
                styles.helpModalCloseButton,
                {
                  top: 8 * helpModalScale,
                  right: 8 * helpModalScale,
                  width: 40 * helpModalScale,
                  height: 40 * helpModalScale,
                },
              ]}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F2E7',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  captureHeader: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    right: scaleByDeviceWidth(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeImage: {
    width: scaleByDeviceWidth(48),
    height: scaleByDeviceWidth(50.4),
  },
  captureTitleImage: {
    width: scaleByDeviceWidth(79),
    height: scaleByDeviceWidth(28),
    tintColor: '#32322D',
  },
  captureTitleSlot: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  remainingCountImage: {
    width: scaleByDeviceWidth(43),
    height: scaleByDeviceWidth(11),
    tintColor: '#32322D',
  },
  remainingCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: scaleByDeviceWidth(5),
  },
  remainingCountText: {
    color: '#32322D',
    fontSize: scaleByDeviceWidth(14),
    fontWeight: '800',
  },
  guideImage: {
    position: 'absolute',
    width: scaleByDeviceWidth(267),
    height: scaleByDeviceWidth(28),
    alignSelf: 'center',
  },
  cameraCard: {
    position: 'absolute',
    alignSelf: 'center',
    aspectRatio: CAMERA_CARD_ASPECT_RATIO,
    paddingHorizontal: scaleByDeviceWidth(20),
    paddingVertical: scaleByDeviceWidth(18),
    borderWidth: scaleByDeviceWidth(3),
    borderColor: '#D5C6AF',
    borderRadius: scaleByDeviceWidth(28),
    backgroundColor: '#FFFDF7',
  },
  cameraBezel: {
    flex: 1,
    padding: scaleByDeviceWidth(8),
    paddingBottom: scaleByDeviceWidth(34),
    borderWidth: scaleByDeviceWidth(4),
    borderColor: '#302D2E',
    borderRadius: scaleByDeviceWidth(14),
    backgroundColor: '#4A4648',
  },
  cameraViewport: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: scaleByDeviceWidth(3),
    borderColor: '#252324',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#242224',
  },
  cameraBrand: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(5),
    left: '50%',
    width: scaleByDeviceWidth(142),
    height: scaleByDeviceWidth(15.55),
    marginLeft: scaleByDeviceWidth(-71),
  },
  captureLimitOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 31, 29, 0.68)',
  },
  captureLimitContent: {
    width: scaleByDeviceWidth(266),
    height: scaleByDeviceWidth(290.24),
  },
  captureLimitImage: {
    width: scaleByDeviceWidth(266),
    height: scaleByDeviceWidth(290.24),
  },
  captureLimitButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: scaleByDeviceWidth(72),
  },
  focusFrame: {
    position: 'absolute',
    top: '11%',
    right: '9%',
    bottom: '13%',
    left: '9%',
  },
  corner: {
    position: 'absolute',
    width: scaleByDeviceWidth(48),
    height: scaleByDeviceWidth(48),
    borderColor: '#FFFFFF',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: scaleByDeviceWidth(6),
    borderLeftWidth: scaleByDeviceWidth(6),
    borderTopLeftRadius: scaleByDeviceWidth(12),
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: scaleByDeviceWidth(6),
    borderRightWidth: scaleByDeviceWidth(6),
    borderTopRightRadius: scaleByDeviceWidth(12),
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: scaleByDeviceWidth(6),
    borderLeftWidth: scaleByDeviceWidth(6),
    borderBottomLeftRadius: scaleByDeviceWidth(12),
  },
  bottomRightCorner: {
    right: 0,
    bottom: 0,
    borderRightWidth: scaleByDeviceWidth(6),
    borderBottomWidth: scaleByDeviceWidth(6),
    borderBottomRightRadius: scaleByDeviceWidth(12),
  },
  bottomControls: {
    position: 'absolute',
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: scaleByDeviceWidth(40),
  },
  albumButton: {
    width: scaleByDeviceWidth(60.95),
    height: scaleByDeviceWidth(64),
  },
  albumButtonImage: {
    width: scaleByDeviceWidth(60.95),
    height: scaleByDeviceWidth(64),
  },
  helpButton: {
    width: scaleByDeviceWidth(60.95),
    height: scaleByDeviceWidth(64),
  },
  helpButtonImage: {
    width: scaleByDeviceWidth(60.95),
    height: scaleByDeviceWidth(64),
  },
  shutterButton: {
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(64),
  },
  shutterButtonImage: {
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(64),
  },
  disabledButton: {
    opacity: 0.45,
  },
  permissionToast: {
    position: 'absolute',
    zIndex: 9,
    width: scaleByDeviceWidth(293),
    height: scaleByDeviceWidth(54),
    alignSelf: 'center',
  },
  permissionToastImage: {
    width: scaleByDeviceWidth(293),
    height: scaleByDeviceWidth(54),
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 29, 27, 0.58)',
  },
  coinDialog: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(208),
  },
  coinDialogImage: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(208),
  },
  dialogCloseButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    right: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(30),
    height: scaleByDeviceWidth(30),
  },
  dialogCancelButton: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(30),
    left: scaleByDeviceWidth(32),
    width: scaleByDeviceWidth(103),
    height: scaleByDeviceWidth(36),
  },
  dialogConfirmButton: {
    position: 'absolute',
    right: scaleByDeviceWidth(32),
    bottom: scaleByDeviceWidth(30),
    width: scaleByDeviceWidth(103),
    height: scaleByDeviceWidth(36),
  },
  helpModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 29, 27, 0.68)',
  },
  helpModal: {},
  helpModalLevel: {
    position: 'absolute',
    color: '#FFF4DD',
    fontFamily: 'EliceDXNeolli-Bold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  helpModalProgressMessage: {
    position: 'absolute',
    color: '#6D5A44',
    fontFamily: 'EliceDXNeolli-Medium',
    includeFontPadding: false,
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  helpModalProgressHighlight: {
    color: '#F1B900',
    fontFamily: 'EliceDXNeolli-Bold',
  },
  helpModalProgressTrack: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#FFFDF8',
  },
  helpModalProgressFill: {
    height: '100%',
    backgroundColor: '#F9CA42',
  },
  helpModalCaptureCounts: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpModalCaptureCount: {
    fontFamily: 'EliceDXNeolli-Bold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  helpModalCaptureCountUnit: {
    fontFamily: 'EliceDXNeolli-Bold',
  },
  helpModalCloseButton: {
    position: 'absolute',
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9E9',
  },
  permissionModalScreen: {
    flex: 1,
    backgroundColor: '#F8F2E7',
  },
  permissionDimOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 29, 27, 0.58)',
  },
  permissionDialog: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(186),
  },
  permissionDialogImage: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(186),
  },
  permissionDialogCloseButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    right: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(30),
    height: scaleByDeviceWidth(30),
  },
  permissionDialogAllowButton: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(30),
    left: scaleByDeviceWidth(90),
    width: scaleByDeviceWidth(100),
    height: scaleByDeviceWidth(36),
  },
  buttonPressed: {
    opacity: 0.65,
  },
});
