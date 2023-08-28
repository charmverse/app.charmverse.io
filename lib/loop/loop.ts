import { GET } from '@charmverse/core/http';

import { loopApiUrl } from 'lib/subscription/constants';

export interface LoopItem {
  itemId: string;
  name: string;
  amount: number;
  frequency: string;
  frequencyCount: number;
  entityId: string;
  acceptedTokens: { [key: number]: string[] };
  externalId: string;
  createdAt: number;
  updatedAt: number;
  active: boolean;
  url?: string;
}

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'api-key': process.env.LOOP_API_KEY as string,
  'entity-id': process.env.LOOP_API_ID as string
};

export async function getLoopProducts(productId?: string) {
  return GET<LoopItem[]>(`${loopApiUrl}/api/v1/items${productId ? `?id=${productId}` : ''}`, null, {
    headers: DEFAULT_HEADERS
  });
}
