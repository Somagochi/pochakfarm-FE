import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useState } from 'react';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { CoinShopComingSoonModal } from '@/src/shared/ui/CoinShopComingSoonModal';

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
  const [isComingSoonVisible, setIsComingSoonVisible] = useState(false);

  function handleAddCoinPress() {
    onPressAddCoin?.();
    setIsComingSoonVisible(true);
  }

  return (
    <>
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
          hitSlop={scaleByDeviceWidth(8)}
          onPress={handleAddCoinPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Image
            resizeMode="contain"
            source={ADD_COIN_ICON}
            style={styles.addCoinIcon}
          />
        </Pressable>
      </ImageBackground>
      <CoinShopComingSoonModal
        onClose={() => setIsComingSoonVisible(false)}
        visible={isComingSoonVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(126),
    height: scaleByDeviceWidth(32.4),
    paddingHorizontal: scaleByDeviceWidth(9),
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: scaleByDeviceWidth(18),
    height: scaleByDeviceWidth(18),
    marginRight: scaleByDeviceWidth(6),
  },
  balance: {
    flex: 1,
    color: '#685A48',
    fontFamily: 'MemomentKkukkukk',
    fontSize: scaleByDeviceWidth(14),
    marginRight: scaleByDeviceWidth(4),
    textAlign: 'right',
  },
  addCoinIcon: {
    width: scaleByDeviceWidth(10.8),
    height: scaleByDeviceWidth(10.8),
  },
  pressed: {
    opacity: 0.75,
  },
});
