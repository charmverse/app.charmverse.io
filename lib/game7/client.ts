import { GET } from '@charmverse/core/http';
import log from 'loglevel';

import type { Game7ScanIdentityResponse, Game7ScanInventoryResponse } from './interface';

export const { GAME7_TOKEN } = process.env;

export const GAME7_BASE_URL = 'https://g7p.io';

function _requestGET<T>(endpoint: string, { apiToken = GAME7_TOKEN }: { apiToken: string | undefined }) {
  if (!apiToken) {
    log.debug('Skip request: No API Key or URL for Game7');
    return Promise.resolve(null);
  }

  return GET<T>(`${GAME7_BASE_URL}/v1${endpoint}`, undefined, {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  });
}

export async function getGame7UserId(queryObj: Record<string, any>) {
  const queryString = Object.keys(queryObj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryObj[key])}`)
    .join('&');

  const data = await _requestGET<Game7ScanIdentityResponse>(`/xps/scan/identity?${queryString}`, {
    apiToken: GAME7_TOKEN
  });

  return data?.data.userId ?? null;
}

export async function getGame7Inventory(userId: string) {
  const data = await _requestGET<Game7ScanInventoryResponse>(`/xps/scan/inventory/${userId}`, {
    apiToken: GAME7_TOKEN
  });

  if (!data?.data) {
    return null;
  }

  return data.data;
}
