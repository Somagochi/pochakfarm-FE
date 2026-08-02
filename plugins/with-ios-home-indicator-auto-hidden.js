const { withAppDelegate } = require('@expo/config-plugins');

const VIEW_CONTROLLER_CLASS = `
private final class HomeIndicatorViewController: UIViewController {
  override var prefersHomeIndicatorAutoHidden: Bool {
    true
  }
}
`;

const CREATE_ROOT_VIEW_CONTROLLER_METHOD = `
  override func createRootViewController() -> UIViewController {
    HomeIndicatorViewController()
  }
`;

module.exports = function withIosHomeIndicatorAutoHidden(config) {
  return withAppDelegate(config, (configWithAppDelegate) => {
    if (configWithAppDelegate.modResults.language !== 'swift') {
      throw new Error(
        '홈 인디케이터 자동 숨김 설정은 Swift AppDelegate만 지원합니다.',
      );
    }

    let contents = configWithAppDelegate.modResults.contents;

    if (!contents.includes('private final class HomeIndicatorViewController')) {
      const appDelegateClassMarker = 'public class AppDelegate: ExpoAppDelegate {';

      if (!contents.includes(appDelegateClassMarker)) {
        throw new Error('AppDelegate 클래스 위치를 찾지 못했습니다.');
      }

      contents = contents.replace(
        appDelegateClassMarker,
        `${VIEW_CONTROLLER_CLASS}\n${appDelegateClassMarker}`,
      );
    }

    if (!contents.includes('HomeIndicatorViewController()')) {
      const reactNativeDelegateMarker =
        'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {';

      if (!contents.includes(reactNativeDelegateMarker)) {
        throw new Error('ReactNativeDelegate 클래스 위치를 찾지 못했습니다.');
      }

      contents = contents.replace(
        reactNativeDelegateMarker,
        `${reactNativeDelegateMarker}${CREATE_ROOT_VIEW_CONTROLLER_METHOD}`,
      );
    }

    configWithAppDelegate.modResults.contents = contents;

    return configWithAppDelegate;
  });
};
