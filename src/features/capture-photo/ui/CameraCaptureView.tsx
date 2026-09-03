import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { CoinShopComingSoonModal } from '@/src/shared/ui/CoinShopComingSoonModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptureGame } from './CaptureGame';
import { CreatureNameConfirmModal } from './CreatureNameConfirmModal';
import { getSupportedImageContentType } from '../lib/getSupportedImageContentType';
import { useCaptureAvailability } from '../model/useCaptureAvailability';
import { subscribeCaptureFlowReset } from '../model/captureFlowReset';
import { useCaptureOverview } from '../model/useCaptureOverview';
import { useCreateCapture } from '../model/useCreateCapture';
import { usePurchaseCaptureAttempt } from '../model/usePurchaseCaptureAttempt';
import type {
  CaptureCardType,
  CaptureProgression,
  CaptureTier,
} from '../model/types';

const CLOSE_IMAGE = require('@/src/shared/assets/images/capture/capture-close.png');
const REMAINING_COUNT_IMAGE = require('@/src/shared/assets/images/capture/remaining-count.png');
const REMAINING_COUNT_BACKGROUND_IMAGE = require(
  '@/src/shared/assets/images/capture/remaining-count-background.png',
);
const COIN_IMAGE = require('@/src/shared/assets/images/farm-status/coin.png');
const ADD_COIN_IMAGE = require('@/src/shared/assets/images/farm-status/add-coin.png');
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
const CAMERA_PERMISSION_CONTINUE_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/camera-permission-continue-button.png');
const CAPTURE_PROBABILITY_MODAL_IMAGE = require('@/src/shared/assets/images/capture/capture-probability-modal.png');
const CAMERA_PERMISSION_TOAST_IMAGE = require('@/src/shared/assets/images/capture/camera-permission-toast.png');
const CAMERA_FRAME_IMAGE = require('@/src/shared/assets/images/capture/camera-frame.png');
const CAPTURED_CAMERA_FRAME_IMAGE = require('@/src/shared/assets/images/capture/captured-camera-frame.png');
const CAMERA_VIEWPORT_GUIDE_IMAGE = require('@/src/shared/assets/images/capture/camera-viewport-guide.png');
const POLAROID_EXIT_IMAGE = require('@/src/shared/assets/images/capture/polaroid-exit.png');
const NAME_PROMPT_IMAGE = require('@/src/shared/assets/images/capture/name-prompt.png');
const CREATURE_NAME_INPUT_IMAGE = require('@/src/shared/assets/images/capture/creature-name-input.png');
const SAVE_NAME_BUTTON_DISABLED_IMAGE = require('@/src/shared/assets/images/capture/save-name-button-disabled.png');
const SAVE_NAME_BUTTON_ACTIVE_IMAGE = require('@/src/shared/assets/images/capture/save-name-button-active.png');
const CAMERA_CARD_ASPECT_RATIO = 1352 / 2080;
const CAPTURED_CAMERA_CARD_ASPECT_RATIO = 1312 / 2080;
const CAMERA_CARD_HORIZONTAL_MARGIN = scaleByDeviceWidth(11);
const CAMERA_CARD_BUTTON_GAP = scaleByDeviceWidth(24);
const CAPTURE_GUIDE_HEIGHT = scaleByDeviceWidth(28);
const CAMERA_GUIDE_GAP = scaleByDeviceWidth(12);
const BOTTOM_BUTTON_SIZE = scaleByDeviceWidth(64);
const POLAROID_EXIT_WIDTH = scaleByDeviceWidth(360);
const POLAROID_EXIT_HEIGHT = scaleByDeviceWidth(20.96);
const POLAROID_EXIT_TOP_OFFSET = scaleByDeviceWidth(3);
const POLAROID_EXIT_FRONT_LIP_TOP = POLAROID_EXIT_HEIGHT * 0.67;
const PHOTO_DEVELOP_DURATION_MS = 600;
const MAX_CAMERA_ZOOM = 1;
const PINCH_ZOOM_SENSITIVITY = 0.5;
const HELP_MODAL_REFERENCE_WIDTH = 328;
const HELP_MODAL_REFERENCE_HEIGHT = 626;
const CAPTURE_COUNT_ITEMS: {
  cardType: CaptureCardType;
  color: string;
  label: string;
}[] = [
  { cardType: 'SKY', color: '#E9B400', label: '하늘' },
  { cardType: 'GROUND', color: '#2F7D35', label: '땅' },
  { cardType: 'SEA', color: '#2185A8', label: '바다' },
  { cardType: 'SPACE', color: '#4A38A7', label: '우주' },
] as const;
const CAPTURE_TIERS: CaptureTier[] = [
  'C',
  'B',
  'A',
  'S',
  'SS',
  'SSS',
] as const;
const DAILY_CAPTURE_LIMIT = 5;

export function CameraCaptureView() {
  const { height: screenHeight, width: screenWidth } =
    useWindowDimensions();
  const cameraRef = useRef<CameraView>(null);
  const isScreenFocused = useIsFocused();
  const [permission, requestPermission, getPermission] =
    useCameraPermissions();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [cameraSessionKey, setCameraSessionKey] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(0);
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedPhotoContentType, setCapturedPhotoContentType] =
    useState('image/jpeg');
  const [capturedWithCoinPayment, setCapturedWithCoinPayment] =
    useState(false);
  const [creatureName, setCreatureName] = useState('');
  const [isNameInputFocused, setIsNameInputFocused] = useState(false);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [hasConfirmedName, setHasConfirmedName] = useState(false);
  const [progressionBeforeGame, setProgressionBeforeGame] =
    useState<CaptureProgression | null>(null);
  const [isNameConfirmModalVisible, setIsNameConfirmModalVisible] =
    useState(false);
  const [shouldStartGameAfterModalDismiss, setShouldStartGameAfterModalDismiss] =
    useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [remainingCaptureCount, setRemainingCaptureCount] =
    useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [isPaidCaptureSessionActive, setIsPaidCaptureSessionActive] =
    useState(false);
  const [isCoinDialogVisible, setIsCoinDialogVisible] = useState(false);
  const [isCoinShopComingSoonVisible, setIsCoinShopComingSoonVisible] =
    useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const {
    availability: captureAvailability,
    clearError: clearCaptureAvailabilityError,
    errorMessage: captureAvailabilityError,
  } = useCaptureAvailability();
  const {
    captureDetail,
    clearError: clearCreateCaptureError,
    createCapture,
    errorMessage: createCaptureError,
    isLoading: isCreatingCapture,
    gameResult,
    result: createCaptureResult,
    submitGameResult,
  } = useCreateCapture();
  const {
    clearError: clearPurchaseAttemptError,
    errorMessage: purchaseAttemptError,
    isLoading: isPurchasingAttempt,
    purchaseAttempt,
  } = usePurchaseCaptureAttempt();
  const {
    clearError: clearCaptureOverviewError,
    errorMessage: captureOverviewError,
    isLoading: isCaptureOverviewLoading,
    overview: captureOverview,
    reload: reloadCaptureOverview,
  } = useCaptureOverview(true);
  const [isPermissionToastVisible, setIsPermissionToastVisible] =
    useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const [developingPhotoUri, setDevelopingPhotoUri] = useState<string | null>(
    null,
  );
  const permissionToastOpacity = useRef(new Animated.Value(0)).current;
  const shutterFlashOpacity = useRef(new Animated.Value(0)).current;
  const developingPhotoTranslateY = useRef(
    new Animated.Value(0),
  ).current;
  const cameraZoomRef = useRef(0);
  const pinchStartZoomRef = useRef(0);
  const normalCameraCardWidthRef = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  const cameraCardTop = insets.top + scaleByDeviceWidth(67);
  const bottomControlsTop =
    screenHeight -
    insets.bottom -
    scaleByDeviceWidth(28) -
    BOTTOM_BUTTON_SIZE;
  const normalAvailableCameraCardHeight =
    bottomControlsTop -
    cameraCardTop -
    CAPTURE_GUIDE_HEIGHT -
    CAMERA_CARD_BUTTON_GAP;
  const normalCameraCardWidth = Math.min(
    screenWidth - CAMERA_CARD_HORIZONTAL_MARGIN * 2,
    normalAvailableCameraCardHeight * CAMERA_CARD_ASPECT_RATIO,
  );
  if (
    !isNameInputFocused ||
    normalCameraCardWidthRef.current === null
  ) {
    normalCameraCardWidthRef.current = normalCameraCardWidth;
  }
  const stableNormalCameraCardWidth =
    normalCameraCardWidthRef.current ?? normalCameraCardWidth;
  const nameControlsTop =
    keyboardTop === null
      ? null
      : keyboardTop -
        scaleByDeviceWidth(56) -
        scaleByDeviceWidth(12);
  const cameraLayoutBottom =
    nameControlsTop ?? bottomControlsTop;
  const isCapturedCameraFrameVisible =
    developingPhotoUri !== null || capturedPhotoUri !== null;
  const cameraCardAspectRatio = isCapturedCameraFrameVisible
    ? CAPTURED_CAMERA_CARD_ASPECT_RATIO
    : CAMERA_CARD_ASPECT_RATIO;
  const availableCameraCardHeight =
    cameraLayoutBottom -
    cameraCardTop -
    CAPTURE_GUIDE_HEIGHT -
    CAMERA_CARD_BUTTON_GAP;
  const cameraCardWidth = Math.min(
    screenWidth - CAMERA_CARD_HORIZONTAL_MARGIN * 2,
    availableCameraCardHeight * cameraCardAspectRatio,
  );
  const cameraCardHeight =
    cameraCardWidth / cameraCardAspectRatio;
  const polaroidExitScale = isNameInputFocused
    ? Math.min(1, cameraCardWidth / stableNormalCameraCardWidth)
    : 1;
  const polaroidExitWidth =
    POLAROID_EXIT_WIDTH * polaroidExitScale;
  const polaroidExitHeight =
    POLAROID_EXIT_HEIGHT * polaroidExitScale;
  const polaroidExitFrontLipTop =
    polaroidExitHeight * 0.67;
  const captureGuideTop =
    cameraCardTop + cameraCardHeight + CAMERA_GUIDE_GAP;
  const polaroidExitTop =
    cameraCardTop -
    polaroidExitHeight / 2 +
    POLAROID_EXIT_TOP_OFFSET;
  const helpModalScale = Math.min(
    screenWidth / 360,
    (screenHeight * 0.92) / HELP_MODAL_REFERENCE_HEIGHT,
  );
  const helpModalWidth =
    HELP_MODAL_REFERENCE_WIDTH * helpModalScale;
  const helpModalHeight =
    HELP_MODAL_REFERENCE_HEIGHT * helpModalScale;
  const currentLevel = captureOverview?.level.currentLevel;
  const remainingExp = captureOverview?.level.remainingExperience;
  const requiredExp = captureOverview?.level.requiredExperience ?? 0;
  const levelProgress = requiredExp > 0
    ? Math.min(
        1,
        Math.max(
          0,
          (captureOverview?.level.currentExperience ?? 0) / requiredExp,
        ),
      )
    : 1;
  const isMaxLevel = requiredExp === 0 && captureOverview !== null;
  const captureCountByType = new Map(
    captureOverview?.captureCounts.map(({ cardType, count }) => [
      cardType,
      count,
    ]),
  );
  const tierProbabilityByTier = new Map(
    captureOverview?.tierProbabilities.map(({ tier, probabilityPercent }) => [
      tier,
      probabilityPercent,
    ]),
  );
  const extraCaptureCost =
    captureAvailability?.attemptPurchaseCost ?? 0;
  const hasCaptureOpportunity =
    captureAvailability !== null &&
    (remainingCaptureCount > 0 || isPaidCaptureSessionActive);
  const isNamingCreature =
    capturedPhotoUri !== null && !hasConfirmedName;
  const isCameraActive =
    appState === 'active' &&
    isScreenFocused &&
    permission?.granted === true &&
    !isNamingCreature &&
    !isCoinDialogVisible;
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(!isNamingCreature && hasCaptureOpportunity)
        .runOnJS(true)
        .onBegin(() => {
          pinchStartZoomRef.current = cameraZoomRef.current;
        })
        .onUpdate(({ scale }) => {
          const nextZoom = Math.min(
            MAX_CAMERA_ZOOM,
            Math.max(
              0,
              pinchStartZoomRef.current +
                (scale - 1) * PINCH_ZOOM_SENSITIVITY,
            ),
          );

          cameraZoomRef.current = nextZoom;
          setCameraZoom(nextZoom);
        }),
    [hasCaptureOpportunity, isNamingCreature],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      setIsCameraReady(false);
      setIsCapturing(false);

      if (nextState === 'active') {
        void (async () => {
          try {
            await getPermission();
          } catch {
            setLocalErrorMessage(
              '카메라 권한 상태를 확인하지 못했습니다. 다시 시도해 주세요.',
            );
          } finally {
            setCameraSessionKey((current) => current + 1);
          }
        })();
      }
    });

    return () => subscription.remove();
  }, [getPermission]);

  useEffect(() => {
    if (!isScreenFocused) {
      setIsCameraReady(false);
      setIsCapturing(false);
    }
  }, [isScreenFocused]);

  useEffect(() => {
    if (!isCameraActive) {
      setIsCameraReady(false);
    }
  }, [isCameraActive]);

  useEffect(() => {
    if (!captureAvailability) {
      return;
    }

    setRemainingCaptureCount(captureAvailability.attempts.remaining);
    setCoinBalance(captureAvailability.coins);
    setIsPaidCaptureSessionActive(false);
  }, [captureAvailability]);

  useEffect(() => {
    if (!createCaptureResult) {
      return;
    }

    setRemainingCaptureCount(createCaptureResult.attempts.remaining);
    setIsPaidCaptureSessionActive(false);
  }, [createCaptureResult]);

  useEffect(() => {
    const handleKeyboardShow = ({
      endCoordinates,
    }: {
      endCoordinates: { screenY: number };
    }) => {
      setKeyboardTop(endCoordinates.screenY);
    };
    const handleKeyboardHide = () => setKeyboardTop(null);
    const willShowSubscription = Keyboard.addListener(
      'keyboardWillShow',
      handleKeyboardShow,
    );
    const didShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      handleKeyboardShow,
    );
    const willHideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      handleKeyboardHide,
    );
    const didHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      handleKeyboardHide,
    );

    return () => {
      willShowSubscription.remove();
      didShowSubscription.remove();
      willHideSubscription.remove();
      didHideSubscription.remove();
    };
  }, []);

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

  useEffect(
    () =>
      subscribeCaptureFlowReset(() => {
        setCapturedPhotoUri(null);
        setDevelopingPhotoUri(null);
        setCreatureName('');
        setCapturedPhotoContentType('image/jpeg');
        setCapturedWithCoinPayment(false);
        setIsNameInputFocused(false);
        setIsNameConfirmModalVisible(false);
        setShouldStartGameAfterModalDismiss(false);
        setHasConfirmedName(false);
      }),
    [],
  );

  const handleRequestPermission = async () => {
    const nextPermission = await requestPermission();

    if (nextPermission.granted) {
      setIsPermissionToastVisible(true);
    }
  };

  const selectCapturePaymentMethod = () => {
    if (remainingCaptureCount > 0) {
      setCapturedWithCoinPayment(false);
      return;
    }

    if (isPaidCaptureSessionActive) {
      setCapturedWithCoinPayment(true);
      setIsPaidCaptureSessionActive(false);
    }
  };

  const developPhoto = async (photoUri: string) => {
    developingPhotoTranslateY.setValue(-cameraCardHeight);
    setDevelopingPhotoUri(photoUri);

    await new Promise<void>((resolve) => {
      Animated.timing(developingPhotoTranslateY, {
        duration: PHOTO_DEVELOP_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => resolve());
    });

    setCapturedPhotoUri(photoUri);
    setDevelopingPhotoUri(null);
  };

  const handleCapture = async () => {
    if (
      !cameraRef.current ||
      !isCameraActive ||
      !isCameraReady ||
      isCapturing ||
      !hasCaptureOpportunity
    ) {
      return;
    }

    setIsCapturing(true);
    Animated.sequence([
      Animated.timing(shutterFlashOpacity, {
        duration: 80,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(shutterFlashOpacity, {
        duration: 140,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      if (photo?.uri) {
        setCapturedPhotoContentType('image/jpeg');
        selectCapturePaymentMethod();
        await developPhoto(photo.uri);
      }
    } catch {
      setHasCameraError(true);
      setLocalErrorMessage('사진을 촬영하지 못했습니다. 다시 시도해 주세요.');
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
        const contentType = getSupportedImageContentType(selectedPhoto);

        if (!contentType) {
          setLocalErrorMessage('지원하지 않는 파일형식입니다.');
          return;
        }

        setCapturedPhotoContentType(contentType);
        selectCapturePaymentMethod();
        await developPhoto(selectedPhoto.uri);
      }
    } catch {
      setLocalErrorMessage(
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

  const handleUseCoins = async () => {
    if (!captureAvailability) {
      setLocalErrorMessage(
        '포착 가능 정보를 불러온 뒤 다시 시도해 주세요.',
      );
      return;
    }

    if (coinBalance < extraCaptureCost) {
      setIsCoinDialogVisible(false);
      setLocalErrorMessage(
        `포착에는 ${extraCaptureCost.toLocaleString('ko-KR')}코인이 필요해요.`,
      );
      return;
    }

    const purchase = await purchaseAttempt();

    if (purchase) {
      setRemainingCaptureCount(purchase.remaining);
      setCoinBalance(purchase.currentCoins);
      setIsPaidCaptureSessionActive(true);
      setIsCoinDialogVisible(false);
    }
  };

  const resetCaptureFlow = () => {
    setCapturedPhotoUri(null);
    setDevelopingPhotoUri(null);
    setCreatureName('');
    setCapturedPhotoContentType('image/jpeg');
    setCapturedWithCoinPayment(false);
    setIsNameInputFocused(false);
    setIsNameConfirmModalVisible(false);
    setShouldStartGameAfterModalDismiss(false);
    setHasConfirmedName(false);
    setProgressionBeforeGame(null);
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
            <Image
              resizeMode="contain"
              source={CAMERA_PERMISSION_CONTINUE_BUTTON_IMAGE}
              style={styles.permissionDialogContinueButtonImage}
            />
            <Pressable
              accessibilityLabel="카메라 권한 안내 닫기"
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/farm')}
              style={styles.permissionDialogCloseButton}
            />
            <Pressable
              accessibilityLabel="카메라 권한 요청 계속하기"
              accessibilityRole="button"
              onPress={handleRequestPermission}
              style={styles.permissionDialogAllowButton}
            />
          </View>
        </View>
      </View>
    );
  }

  if (capturedPhotoUri && hasConfirmedName) {
    return (
      <CaptureGame
        apiErrorMessage={createCaptureError}
        captureDetail={captureDetail}
        gameResult={gameResult}
        initialProgression={progressionBeforeGame}
        cardType={createCaptureResult?.cardType}
        onCloseApiError={() => {
          clearCreateCaptureError();
          router.replace('/(tabs)/farm');
        }}
        onClose={() => {
          resetCaptureFlow();
          router.replace('/(tabs)/farm');
        }}
        onGameResult={(throws) => {
          void (async () => {
            const overviewBeforeGameResult =
              (await reloadCaptureOverview()) ?? captureOverview;

            if (overviewBeforeGameResult) {
              setProgressionBeforeGame({
                level: overviewBeforeGameResult.level.currentLevel,
                experience:
                  overviewBeforeGameResult.level.currentExperience,
                requiredExperienceForNextLevel:
                  overviewBeforeGameResult.level.requiredExperience,
              });
            }

            await submitGameResult(throws);
          })();
        }}
        photoUri={capturedPhotoUri}
        ringShrinkDurationMs={
          createCaptureResult?.difficulty.ringShrinkDurationMs
        }
        tier={createCaptureResult?.tier}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.captureHeader,
          {
            top: insets.top + scaleByDeviceWidth(8),
            left:
              (screenWidth - stableNormalCameraCardWidth) / 2,
            right:
              (screenWidth - stableNormalCameraCardWidth) / 2,
          },
        ]}
      >
        <View style={styles.captureStatusGroup}>
          <View
            accessibilityLabel={`남은횟수 ${remainingCaptureCount} / ${DAILY_CAPTURE_LIMIT}`}
            style={styles.remainingCountGroup}
          >
            <Image
              resizeMode="contain"
              source={REMAINING_COUNT_BACKGROUND_IMAGE}
              style={styles.remainingCountBackground}
            />
            <Image
              resizeMode="contain"
              source={REMAINING_COUNT_IMAGE}
              style={styles.remainingCountImage}
            />
            <Text style={styles.remainingCountText}>
              {remainingCaptureCount} / {DAILY_CAPTURE_LIMIT}
            </Text>
          </View>

          <View
            accessibilityLabel={`보유 코인 ${coinBalance.toLocaleString('ko-KR')}`}
            style={styles.coinBalanceGroup}
          >
            <Image
              resizeMode="stretch"
              source={REMAINING_COUNT_BACKGROUND_IMAGE}
              style={styles.coinBalanceBackground}
            />
            <Image
              resizeMode="contain"
              source={COIN_IMAGE}
              style={styles.coinImage}
            />
            <Text numberOfLines={1} style={styles.coinBalanceText}>
              {coinBalance.toLocaleString('ko-KR')}
            </Text>
            <Pressable
              accessibilityLabel="코인 추가"
              accessibilityRole="button"
              hitSlop={scaleByDeviceWidth(8)}
              onPress={() => setIsCoinShopComingSoonVisible(true)}
              style={({ pressed }) => pressed && styles.buttonPressed}
            >
              <Image
                resizeMode="contain"
                source={ADD_COIN_IMAGE}
                style={styles.addCoinImage}
              />
            </Pressable>
          </View>
        </View>

        {!developingPhotoUri && (
          <Pressable
            accessibilityLabel="카메라 닫기"
            accessibilityRole="button"
            onPress={() => {
              if (isNamingCreature) {
                resetCaptureFlow();
                return;
              }

              router.replace('/(tabs)/farm');
            }}
            style={({ pressed }) => pressed && styles.buttonPressed}
          >
            <Image
              resizeMode="contain"
              source={CLOSE_IMAGE}
              style={styles.closeImage}
            />
          </Pressable>
        )}
      </View>

      {developingPhotoUri && (
        <View
          pointerEvents="none"
          style={[
            styles.developingPhotoStage,
            {
              top: cameraCardTop,
              width: cameraCardWidth,
              height: cameraCardHeight,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.developingPhoto,
              {
                width: cameraCardWidth,
                height: cameraCardHeight,
                transform: [{ translateY: developingPhotoTranslateY }],
              },
            ]}
          >
            <View style={styles.cameraViewport}>
              <Image
                accessibilityLabel="출력 중인 촬영 사진"
                resizeMode="contain"
                source={{ uri: developingPhotoUri }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dimOverlay} pointerEvents="none" />
            </View>
            <Image
              resizeMode="stretch"
              source={CAPTURED_CAMERA_FRAME_IMAGE}
              style={styles.cameraFrame}
            />
          </Animated.View>
        </View>
      )}

      {isCapturedCameraFrameVisible && (
        <Image
          accessibilityLabel="폴라로이드 사진 출구 안쪽"
          resizeMode="stretch"
          source={POLAROID_EXIT_IMAGE}
          style={[
            styles.polaroidExitBack,
            {
              top: polaroidExitTop,
              width: polaroidExitWidth,
              height: polaroidExitHeight,
            },
          ]}
        />
      )}

      {developingPhotoUri && (
        <View
          pointerEvents="none"
          style={[
            styles.polaroidExitFrontLip,
            {
              top: polaroidExitTop + polaroidExitFrontLipTop,
              width: polaroidExitWidth,
              height: polaroidExitHeight - polaroidExitFrontLipTop,
            },
          ]}
        >
          <Image
            resizeMode="stretch"
            source={POLAROID_EXIT_IMAGE}
            style={[
              styles.polaroidExitFrontLipImage,
              {
                top: -polaroidExitFrontLipTop,
                width: polaroidExitWidth,
                height: polaroidExitHeight,
              },
            ]}
          />
        </View>
      )}

      <Image
        accessibilityLabel="촬영 가이드"
        resizeMode="contain"
        source={
          isNamingCreature
            ? NAME_PROMPT_IMAGE
            : CAPTURE_GUIDE_IMAGES[guideIndex]
        }
        style={[
          styles.guideImage,
          { top: captureGuideTop },
        ]}
      />

      {!developingPhotoUri && (
        <View
          style={[
            styles.cameraCard,
            {
              top: cameraCardTop,
              width: cameraCardWidth,
              height: cameraCardHeight,
            },
          ]}
        >
        <View style={styles.cameraViewport}>
            {isNamingCreature ? (
              <>
                <Image
                  accessibilityLabel="이름을 정할 동물 사진"
                  resizeMode="contain"
                  source={{ uri: capturedPhotoUri ?? '' }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.dimOverlay} pointerEvents="none" />
              </>
            ) : (
              <GestureDetector gesture={pinchGesture}>
                <View style={StyleSheet.absoluteFill}>
                  {isCameraActive && (
                    <CameraView
                      active={isCameraActive}
                      animateShutter={false}
                      facing="back"
                      flash="off"
                      key={cameraSessionKey}
                      onCameraReady={() => {
                        setHasCameraError(false);
                        setIsCameraReady(true);
                      }}
                      onMountError={() => {
                        setHasCameraError(true);
                        setIsCameraReady(false);
                        setLocalErrorMessage(
                          '카메라를 실행하지 못했습니다. 다시 시도해 주세요.',
                        );
                      }}
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      zoom={cameraZoom}
                    />
                  )}
                  <View style={styles.dimOverlay} pointerEvents="none" />
                  {hasCaptureOpportunity && (
                    <Image
                      accessibilityLabel="촬영 영역 가이드"
                      resizeMode="contain"
                      source={CAMERA_VIEWPORT_GUIDE_IMAGE}
                      style={styles.cameraViewportGuide}
                    />
                  )}
                </View>
              </GestureDetector>
            )}
            {!isNamingCreature && !hasCaptureOpportunity && (
              <View style={styles.captureLimitOverlay}>
                <View style={styles.captureLimitContent}>
                  <Image
                    accessibilityLabel="오늘의 포착 기회를 모두 사용했어요"
                    resizeMode="contain"
                    source={CAPTURE_LIMIT_IMAGE}
                    style={styles.captureLimitImage}
                  />
                  <Pressable
                    accessibilityLabel={`${extraCaptureCost.toLocaleString('ko-KR')}코인으로 포착하기`}
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
        <View pointerEvents="none" style={styles.cameraFrame}>
          <Image
            resizeMode="stretch"
            source={
              isCapturedCameraFrameVisible
                ? CAPTURED_CAMERA_FRAME_IMAGE
                : CAMERA_FRAME_IMAGE
            }
            style={styles.cameraFrameImage}
          />
        </View>
        </View>
      )}

      {isNamingCreature ? (
        <View
          style={[
            styles.nameControls,
            nameControlsTop === null
              ? {
                  bottom:
                    insets.bottom + scaleByDeviceWidth(28),
                }
              : { top: nameControlsTop },
          ]}
        >
          <View style={styles.nameInputContainer}>
            {!isNameInputFocused && !creatureName && (
              <Image
                resizeMode="contain"
                source={CREATURE_NAME_INPUT_IMAGE}
                style={styles.nameInputBackground}
              />
            )}
            <TextInput
              accessibilityLabel="동물 이름 입력"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
              onBlur={() => setIsNameInputFocused(false)}
              onChangeText={setCreatureName}
              onFocus={() => setIsNameInputFocused(true)}
              placeholder={
                isNameInputFocused
                  ? '이름을 입력해주세요 (최대 6자)'
                  : undefined
              }
              placeholderTextColor="#AAA9A2"
              returnKeyType="done"
              style={styles.nameInput}
              value={creatureName}
            />
          </View>
          <Pressable
            accessibilityLabel="동물 이름 저장"
            accessibilityRole="button"
            disabled={!creatureName.trim()}
            onPress={() => {
              Keyboard.dismiss();
              setIsNameConfirmModalVisible(true);
            }}
            style={styles.saveNameButton}
          >
            <Image
              resizeMode="contain"
              source={
                creatureName.trim()
                  ? SAVE_NAME_BUTTON_ACTIVE_IMAGE
                  : SAVE_NAME_BUTTON_DISABLED_IMAGE
              }
              style={styles.saveNameButtonImage}
            />
          </Pressable>
        </View>
      ) : developingPhotoUri ? null : (
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
            disabled={
              isCapturing ||
              !isCameraActive ||
              !isCameraReady ||
              !hasCaptureOpportunity
            }
            onPress={handleCapture}
            style={({ pressed }) => [
              styles.shutterButton,
              (pressed || isCapturing) && styles.buttonPressed,
              (!isCameraActive ||
                !isCameraReady ||
                !hasCaptureOpportunity) &&
                styles.disabledButton,
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
      )}

      <CreatureNameConfirmModal
        creatureName={creatureName.trim()}
        isConfirming={isCreatingCapture}
        onClose={() => setIsNameConfirmModalVisible(false)}
        onConfirm={async () => {
          if (!capturedPhotoUri || isCreatingCapture) {
            return;
          }

          const isCreated = await createCapture({
            contentType: capturedPhotoContentType,
            animalName: creatureName.trim(),
            allowCoinPayment: capturedWithCoinPayment,
            photoUri: capturedPhotoUri,
          });

          if (!isCreated) {
            setIsNameConfirmModalVisible(false);
            return;
          }

          setShouldStartGameAfterModalDismiss(true);
          setIsNameConfirmModalVisible(false);

          if (Platform.OS !== 'ios') {
            setShouldStartGameAfterModalDismiss(false);
            setHasConfirmedName(true);
          }
        }}
        onDismiss={() => {
          if (!shouldStartGameAfterModalDismiss) {
            return;
          }

          setShouldStartGameAfterModalDismiss(false);
          setHasConfirmedName(true);
        }}
        visible={isNameConfirmModalVisible}
      />

      <ErrorModal
        message={createCaptureError}
        onClose={() => {
          clearCreateCaptureError();
          resetCaptureFlow();
          router.replace('/(tabs)/farm');
        }}
      />

      <ErrorModal
        message={purchaseAttemptError}
        onClose={clearPurchaseAttemptError}
      />

      <ErrorModal
        message={captureAvailabilityError ?? captureOverviewError ?? localErrorMessage}
        onClose={() => {
          clearCaptureAvailabilityError();
          clearCaptureOverviewError();
          setLocalErrorMessage(null);

          if (hasCameraError) {
            setHasCameraError(false);
            setIsCameraReady(false);
            setCameraSessionKey((current) => current + 1);
          }
        }}
      />

      <CoinShopComingSoonModal
        onClose={() => setIsCoinShopComingSoonVisible(false)}
        visible={isCoinShopComingSoonVisible}
      />


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

      <Animated.View
        pointerEvents="none"
        style={[styles.shutterFlash, { opacity: shutterFlashOpacity }]}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!isPurchasingAttempt) {
            setIsCoinDialogVisible(false);
          }
        }}
        statusBarTranslucent
        transparent
        visible={isCoinDialogVisible}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.coinDialog}>
            <Image
              accessibilityLabel={`${extraCaptureCost.toLocaleString('ko-KR')}코인으로 포착 기회를 추가할까요?`}
              resizeMode="contain"
              source={CAPTURE_COIN_DIALOG_IMAGE}
              style={styles.coinDialogImage}
            />
            <Pressable
              accessibilityLabel="닫기"
              accessibilityRole="button"
              disabled={isPurchasingAttempt}
              onPress={() => setIsCoinDialogVisible(false)}
              style={styles.dialogCloseButton}
            />
            <Pressable
              accessibilityLabel="취소하기"
              accessibilityRole="button"
              disabled={isPurchasingAttempt}
              onPress={() => setIsCoinDialogVisible(false)}
              style={styles.dialogCancelButton}
            />
            <Pressable
              accessibilityLabel={`${extraCaptureCost.toLocaleString('ko-KR')}코인 사용`}
              accessibilityRole="button"
              disabled={isPurchasingAttempt}
              onPress={() => void handleUseCoins()}
              style={[
                styles.dialogConfirmButton,
                isPurchasingAttempt && styles.buttonPressed,
              ]}
            />
          </View>
        </View>
      </Modal>

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
              accessibilityLabel={
                currentLevel === undefined
                  ? '현재 레벨 불러오는 중'
                  : `현재 레벨 ${currentLevel}`
              }
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
              {currentLevel ?? '-'}
            </Text>
            <Text
              accessibilityLabel={
                captureOverview === null
                  ? '포착 확률 정보 불러오는 중'
                  : isMaxLevel
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
              {captureOverview === null ? (
                isCaptureOverviewLoading ? (
                  '불러오는 중...'
                ) : (
                  '포착 확률을 불러오지 못했어요'
                )
              ) : isMaxLevel ? (
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
              {CAPTURE_COUNT_ITEMS.map(
                ({ cardType, color, label }) => {
                  const count = captureCountByType.get(cardType);

                  return (
                    <Text
                      accessibilityLabel={
                        count === undefined
                          ? `${label} 타입 포착 횟수 불러오는 중`
                          : `${label} 타입 ${count}번 포착`
                      }
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
                      {count ?? '-'}
                      <Text
                        style={[
                          styles.helpModalCaptureCountUnit,
                          { fontSize: 9 * helpModalScale },
                        ]}
                      >
                        번
                      </Text>
                    </Text>
                  );
                },
              )}
            </View>
            <View
              style={[
                styles.helpModalTierProbabilities,
                {
                  top: 558 * helpModalScale,
                  left: 31 * helpModalScale,
                  width: 266 * helpModalScale,
                  height: 20 * helpModalScale,
                },
              ]}
            >
              {CAPTURE_TIERS.map((tier) => {
                const probability = tierProbabilityByTier.get(tier);

                return (
                  <Text
                    accessibilityLabel={
                      probability === undefined
                        ? `${tier} 등급 확률 불러오는 중`
                        : `${tier} 등급 확률 ${probability}퍼센트`
                    }
                    key={tier}
                    style={[
                      styles.helpModalTierProbability,
                      {
                        width: (266 / CAPTURE_TIERS.length) * helpModalScale,
                        fontSize: 8 * helpModalScale,
                        lineHeight: 15 * helpModalScale,
                      },
                    ]}
                  >
                    {probability === undefined ? '-' : `${probability}%`}
                  </Text>
                );
              })}
            </View>
            {captureOverviewError && !isCaptureOverviewLoading && (
              <Pressable
                accessibilityLabel="포착 확률 다시 불러오기"
                accessibilityRole="button"
                onPress={() => void reloadCaptureOverview()}
                style={[
                  styles.helpModalRetryButton,
                  {
                    top: 225 * helpModalScale,
                    left: 90 * helpModalScale,
                    width: 192.75 * helpModalScale,
                    height: 22 * helpModalScale,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.helpModalRetryText,
                    { fontSize: 8 * helpModalScale },
                  ]}
                >
                  {captureOverviewError} · 다시 시도
                </Text>
              </Pressable>
            )}
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
  captureStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: scaleByDeviceWidth(8),
  },
  remainingCountImage: {
    width: scaleByDeviceWidth(43),
    height: scaleByDeviceWidth(11),
    tintColor: '#32322D',
  },
  remainingCountGroup: {
    width: scaleByDeviceWidth(105),
    height: scaleByDeviceWidth(32),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: scaleByDeviceWidth(5),
  },
  remainingCountBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(105),
    height: scaleByDeviceWidth(32),
  },
  remainingCountText: {
    color: '#41413A',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(11),
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: scaleByDeviceWidth(1) }],
  },
  coinBalanceGroup: {
    width: scaleByDeviceWidth(126),
    height: scaleByDeviceWidth(32.4),
    paddingHorizontal: scaleByDeviceWidth(9),
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinBalanceBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(126),
    height: scaleByDeviceWidth(32.4),
  },
  coinImage: {
    width: scaleByDeviceWidth(18),
    height: scaleByDeviceWidth(18),
    marginRight: scaleByDeviceWidth(6),
  },
  coinBalanceText: {
    flex: 1,
    color: '#685A48',
    fontFamily: 'MemomentKkukkukk',
    fontSize: scaleByDeviceWidth(14),
    marginRight: scaleByDeviceWidth(4),
    textAlign: 'right',
  },
  addCoinImage: {
    width: scaleByDeviceWidth(10.8),
    height: scaleByDeviceWidth(10.8),
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
  },
  cameraFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cameraFrameImage: {
    width: '100%',
    height: '100%',
  },
  developingPhotoStage: {
    position: 'absolute',
    zIndex: 4,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  developingPhoto: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  polaroidExitBack: {
    position: 'absolute',
    width: POLAROID_EXIT_WIDTH,
    height: POLAROID_EXIT_HEIGHT,
    alignSelf: 'center',
  },
  polaroidExitFrontLip: {
    position: 'absolute',
    zIndex: 5,
    width: POLAROID_EXIT_WIDTH,
    height: POLAROID_EXIT_HEIGHT - POLAROID_EXIT_FRONT_LIP_TOP,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  polaroidExitFrontLipImage: {
    position: 'absolute',
    top: -POLAROID_EXIT_FRONT_LIP_TOP,
    width: POLAROID_EXIT_WIDTH,
    height: POLAROID_EXIT_HEIGHT,
  },
  cameraViewport: {
    position: 'absolute',
    top: '5%',
    right: '7.7%',
    bottom: '8.1%',
    left: '8.1%',
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#242224',
  },
  cameraViewportGuide: {
    position: 'absolute',
    width: scaleByDeviceWidth(229.8),
    height: scaleByDeviceWidth(328.18),
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: scaleByDeviceWidth(-114.9) },
      { translateY: scaleByDeviceWidth(-164.09) },
    ],
  },
  captureLimitOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 31, 29, 0.68)',
  },
  captureLimitContent: {
    width: '90%',
    aspectRatio: 1064 / 1161,
  },
  captureLimitImage: {
    width: '100%',
    height: '100%',
  },
  captureLimitButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '24.8%',
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
  nameControls: {
    position: 'absolute',
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: scaleByDeviceWidth(2),
  },
  nameInputContainer: {
    width: scaleByDeviceWidth(246),
    height: scaleByDeviceWidth(56),
    overflow: 'hidden',
    borderWidth: scaleByDeviceWidth(1),
    borderColor: '#E8E1CE',
    borderRadius: scaleByDeviceWidth(14),
    backgroundColor: '#FFFFFF',
  },
  nameInputBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(246),
    height: scaleByDeviceWidth(56),
  },
  nameInput: {
    flex: 1,
    paddingHorizontal: scaleByDeviceWidth(16),
    color: '#5F5140',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
  },
  saveNameButton: {
    width: scaleByDeviceWidth(80),
    height: scaleByDeviceWidth(56),
  },
  saveNameButtonImage: {
    width: scaleByDeviceWidth(80),
    height: scaleByDeviceWidth(56),
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
  shutterFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
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
  helpModalTierProbabilities: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF7',
  },
  helpModalTierProbability: {
    color: '#413D37',
    fontFamily: 'EliceDXNeolli-Medium',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  helpModalRetryButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpModalRetryText: {
    color: '#B45C4D',
    fontFamily: 'EliceDXNeolli-Medium',
    includeFontPadding: false,
    textAlign: 'center',
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
  permissionDialogContinueButtonImage: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(27.5),
    left: scaleByDeviceWidth(87.375),
    width: scaleByDeviceWidth(105.25),
    height: scaleByDeviceWidth(42),
  },
  permissionDialogAllowButton: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(27.5),
    left: scaleByDeviceWidth(87.375),
    width: scaleByDeviceWidth(105.25),
    height: scaleByDeviceWidth(42),
  },
  buttonPressed: {
    opacity: 0.65,
  },
});
