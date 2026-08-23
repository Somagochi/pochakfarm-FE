import { apiClient } from '@/src/shared/api/client';

import type {
  AnimalCardType,
  AnimalsPage,
} from '@/src/entities/creature';

type SearchAnimalsParams = {
  cursor?: number;
  keyword?: string;
  type?: AnimalCardType;
};

type SearchAnimalsResponse = {
  data: AnimalsPage;
  datetime: string;
};

export async function searchAnimalsApi({
  cursor,
  keyword,
  type,
}: SearchAnimalsParams) {
  const queryParams: string[] = [];
  const hasKeyword = keyword !== undefined && keyword.length > 0;

  if (type !== undefined) {
    queryParams.push(`type=${encodeURIComponent(type)}`);
  }

  if (hasKeyword) {
    queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
  }

  if (cursor !== undefined) {
    queryParams.push(`cursor=${encodeURIComponent(cursor)}`);
  }

  const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  const path = hasKeyword ? '/api/animals/search' : '/api/animals';
  const response = await apiClient.get<SearchAnimalsResponse>(
    `${path}${query}`,
  );

  return response.data;
}
