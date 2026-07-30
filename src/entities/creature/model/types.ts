import type { ImageSourcePropType } from 'react-native';

export type CreatureEnvironment = 'sky' | 'land' | 'sea' | 'space';
export type CreatureTier = 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type FarmCreatureListItem = {
  creatureImageSource: ImageSourcePropType;
  environment: CreatureEnvironment;
  id: string;
  name: string;
  tier: CreatureTier;
};
