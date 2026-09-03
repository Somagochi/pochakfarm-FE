import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export async function convertHeicImageToJpeg(uri: string) {
  const convertedImage = await manipulateAsync(uri, [], {
    compress: 1,
    format: SaveFormat.JPEG,
  });

  return convertedImage.uri;
}
