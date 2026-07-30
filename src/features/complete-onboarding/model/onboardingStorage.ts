import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'pochakfarm:onboarding-completed';

export async function hasCompletedOnboarding() {
  return (
    (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === 'true'
  );
}

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}
