export type FarmType = 'SKY' | 'GROUND' | 'SEA' | 'SPACE';

export type FarmAnimal = {
  animalId: number;
  animalName: string;
  cardImageUrl: string | null;
  animalImageUrl: string | null;
};

export type FarmSlot = {
  slotNum: number;
  animal: FarmAnimal | null;
};

export type FarmFloor = {
  floorNum: number;
  unlocked: boolean;
  slots: FarmSlot[];
};

export type Farm = {
  type: FarmType;
  page: number;
  size: number;
  totalPages: number;
  floors: FarmFloor[];
};
