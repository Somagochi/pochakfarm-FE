import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

const STATUS_BACKGROUND = require('@/src/shared/assets/images/farm-status/status-background.png');
const COIN_ICON = require('@/src/shared/assets/images/farm-status/coin.png');
const ADD_COIN_ICON = require('@/src/shared/assets/images/farm-status/add-coin.png');

type CoinBalanceBarProps = {
  balance?: number;
  onPressAddCoin?: () => void;
};

export function CoinBalanceBar({
  balance = 12500,
  onPressAddCoin,
}: CoinBalanceBarProps) {
  return (
    <ImageBackground
      resizeMode="stretch"
      source={STATUS_BACKGROUND}
      style={styles.container}
    >
      <Image resizeMode="contain" source={COIN_ICON} style={styles.coinIcon} />
      <Text numberOfLines={1} style={styles.balance}>
        {balance.toLocaleString('ko-KR')}
      </Text>
      <Pressable
        accessibilityLabel="코인 추가"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onPressAddCoin?.()}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image
          resizeMode="contain"
          source={ADD_COIN_ICON}
          style={styles.addCoinIcon}
        />
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 126,
    height: 32.4,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  balance: {
    flex: 1,
    color: '#685A48',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  addCoinIcon: {
    width: 10.8,
    height: 10.8,
  },
  pressed: {
    opacity: 0.75,
  },
});
