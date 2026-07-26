const {
  AndroidConfig,
  withAndroidManifest,
} = require('@expo/config-plugins');

const ML_KIT_DEPENDENCIES_KEY = 'com.google.mlkit.vision.DEPENDENCIES';
const ML_KIT_DEPENDENCIES = 'subject_segment,barcode_ui';
const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';

module.exports = function withSubjectSegmentation(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      configWithManifest.modResults,
    );

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      ML_KIT_DEPENDENCIES_KEY,
      ML_KIT_DEPENDENCIES,
    );

    configWithManifest.modResults.manifest.$['xmlns:tools'] = TOOLS_NAMESPACE;

    const dependencyMetadata = application['meta-data']?.find(
      (item) => item.$['android:name'] === ML_KIT_DEPENDENCIES_KEY,
    );

    if (dependencyMetadata) {
      dependencyMetadata.$['tools:replace'] = 'android:value';
    }

    return configWithManifest;
  });
};
