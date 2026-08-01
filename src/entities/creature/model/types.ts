import type { ImageSourcePropType } from 'react-native';

export type CreatureEnvironment = 'sky' | 'land' | 'sea' | 'space';
export type CreatureTier = 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type FarmCreatureListItem = {
  creatureImageSource?: ImageSourcePropType;
  environment: CreatureEnvironment;
  id: string;
  name: string;
  tier: CreatureTier;
};

export type AnimalCardType = 'GROUND' | 'SKY' | 'SEA' | 'SPACE';

export type Animal = {
  animalId: number;
  animalName: string;
  cardType: AnimalCardType;
  tier: CreatureTier;
  cardImageUrl: string | null;
  animalImageUrl: string | null;
};

export type AnimalsPage = {
  content: Animal[];
  nextCursor: number | null;
  hasNext: boolean;
};

export type AnimalSkill = {
  name: string;
  description: string;
};

export type AnimalDetail = Animal & {
  skill1: AnimalSkill;
  skill2: AnimalSkill;
};
