import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  Morphology,
  Offset,
  useImage,
} from '@shopify/react-native-skia';
import type { StyleProp, ViewStyle } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const THUMBNAIL_SIZE = 140;
export const STICKER_EFFECT_PADDING = 12;
export const STICKER_CANVAS_SIZE =
  THUMBNAIL_SIZE + STICKER_EFFECT_PADDING * 2;

const BLACK_AT_HALF_OPACITY = [
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 0.5, 0,
];

const SOLID_WHITE = [
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 0, 0, 1, 0,
];

type GymLeaderStickerThumbnailProps = {
  imageUrl: string;
  style?: StyleProp<ViewStyle>;
};

export function GymLeaderStickerThumbnail({
  imageUrl,
  style,
}: GymLeaderStickerThumbnailProps) {
  const image = useImage(imageUrl);

  if (!image) {
    return null;
  }

  const padding = scaleByDeviceWidth(STICKER_EFFECT_PADDING);
  const thumbnailSize = scaleByDeviceWidth(THUMBNAIL_SIZE);

  return (
    <Canvas pointerEvents="none" style={style}>
      <SkiaImage
        fit="contain"
        height={thumbnailSize}
        image={image}
        width={thumbnailSize}
        x={padding}
        y={padding}
      >
        <ColorMatrix matrix={BLACK_AT_HALF_OPACITY} />
        <Morphology radius={scaleByDeviceWidth(4)} />
        <Offset
          x={scaleByDeviceWidth(4)}
          y={scaleByDeviceWidth(6)}
        />
      </SkiaImage>

      <SkiaImage
        fit="contain"
        height={thumbnailSize}
        image={image}
        width={thumbnailSize}
        x={padding}
        y={padding}
      >
        <ColorMatrix matrix={SOLID_WHITE} />
        <Morphology radius={scaleByDeviceWidth(2)} />
      </SkiaImage>

      <SkiaImage
        fit="contain"
        height={thumbnailSize}
        image={image}
        width={thumbnailSize}
        x={padding}
        y={padding}
      />
    </Canvas>
  );
}
