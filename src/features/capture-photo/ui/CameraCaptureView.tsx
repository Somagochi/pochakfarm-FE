import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptureGame } from './CaptureGame';

const CLOSE_IMAGE = require('@/src/shared/assets/images/capture/capture-close.png');
const CAPTURE_TITLE_IMAGE = require('@/src/shared/assets/images/capture/capture-title.png');
const REMAINING_COUNT_IMAGE = require('@/src/shared/assets/images/capture/remaining-count.png');
const CAPTURE_GUIDE_IMAGE = require('@/src/shared/assets/images/capture/capture-guide.png');
const ALBUM_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/album-button.png');
const HELP_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/help-button.png');
const SHUTTER_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/shutter-button.png');

export function CameraCaptureView() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
      }
    } catch {
      Alert.alert('촬영 실패', '사진을 촬영하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSelectPhoto = async () => {
    if (isSelectingPhoto) {
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

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
        <Text style={styles.permissionDescription}>
          동물을 포착하려면 카메라 사용을 허용해 주세요.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>카메라 권한 허용</Text>
        </Pressable>
        <Pressable
          disabled={isSelectingPhoto}
          onPress={handleSelectPhoto}
          style={styles.albumPermissionButton}
        >
          <Text style={styles.albumPermissionButtonText}>
            앨범에서 사진 선택
          </Text>
        </Pressable>
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
      <CameraView
        animateShutter={false}
        facing="back"
        flash="off"
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.dimOverlay} pointerEvents="none" />

      <View style={[styles.captureHeader, { top: insets.top + 8 }]}>
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
          accessibilityLabel="남은횟수 5 / 5"
          style={styles.remainingCountGroup}
        >
          <Image
            resizeMode="contain"
            source={REMAINING_COUNT_IMAGE}
            style={styles.remainingCountImage}
          />
          <Text style={styles.remainingCountText}>5 / 5</Text>
        </View>
      </View>

      <Image
        accessibilityLabel="화면 각도에 맞춰 촬영해주세요"
        resizeMode="contain"
        source={CAPTURE_GUIDE_IMAGE}
        style={[styles.guideImage, { top: insets.top + 89.2 }]}
      />

      <View pointerEvents="none" style={styles.focusFrame}>
        <View style={[styles.corner, styles.topLeftCorner]} />
        <View style={[styles.corner, styles.topRightCorner]} />
        <View style={[styles.corner, styles.bottomLeftCorner]} />
        <View style={[styles.corner, styles.bottomRightCorner]} />
      </View>

      <View
        style={[
          styles.bottomControls,
          {
            bottom: insets.bottom + 28,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="앨범에서 사진 선택"
          accessibilityRole="button"
          disabled={isSelectingPhoto}
          onPress={handleSelectPhoto}
          style={({ pressed }) => [
            styles.albumButton,
            (pressed || isSelectingPhoto) && styles.buttonPressed,
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
          disabled={isCapturing}
          onPress={handleCapture}
          style={({ pressed }) => [
            styles.shutterButton,
            (pressed || isCapturing) && styles.buttonPressed,
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
          onPress={() =>
            Alert.alert(
              '촬영 도움말',
              '동물이 흰색 프레임 안에 들어오도록 맞춘 뒤 촬영해 주세요.',
            )
          }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  captureHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeImage: {
    width: 48,
    height: 50.4,
  },
  captureTitleImage: {
    width: 79,
    height: 28,
  },
  captureTitleSlot: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  remainingCountImage: {
    width: 43,
    height: 11,
  },
  remainingCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  remainingCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  guideImage: {
    position: 'absolute',
    width: 215,
    height: 28,
    alignSelf: 'center',
  },
  focusFrame: {
    position: 'absolute',
    top: '24%',
    left: '9%',
    right: '9%',
    height: '45%',
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: '#FFFFFF',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderTopLeftRadius: 12,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderTopRightRadius: 12,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderBottomLeftRadius: 12,
  },
  bottomRightCorner: {
    right: 0,
    bottom: 0,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderBottomRightRadius: 12,
  },
  bottomControls: {
    position: 'absolute',
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 40,
  },
  albumButton: {
    width: 60.95,
    height: 64,
  },
  albumButtonImage: {
    width: 60.95,
    height: 64,
  },
  helpButton: {
    width: 60.95,
    height: 64,
  },
  helpButtonImage: {
    width: 60.95,
    height: 64,
  },
  shutterButton: {
    width: 64,
    height: 64,
  },
  shutterButtonImage: {
    width: 64,
    height: 64,
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFF9E9',
  },
  permissionTitle: {
    color: '#31533B',
    fontSize: 22,
    fontWeight: '800',
  },
  permissionDescription: {
    marginTop: 10,
    color: '#5E6E62',
    fontSize: 15,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#31533B',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  albumPermissionButton: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: '#31533B',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  albumPermissionButtonText: {
    color: '#31533B',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.65,
  },
});
