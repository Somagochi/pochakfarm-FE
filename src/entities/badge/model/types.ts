export type Badge = {
  code: string;
  category: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailImageUrl: string;
  acquiredAt: string;
};

export type BadgesPage = {
  content: Badge[];
  nextCursor: number | null;
  hasNext: boolean;
};
