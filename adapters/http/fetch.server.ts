import type { RequestInitWithRetry } from 'fetch-retry';
import fetchRetry from 'fetch-retry';
import { fetch as nativeFetch } from 'undici';

import { transformResponse } from './fetch';

const delayMultiplier = process.env.NODE_ENV === 'test' ? 1 : 1000;

const fetchAndRetry = fetchRetry(nativeFetch as any, {
  retries: 5,
  retryOn: [500, 501, 502, 503],
  retryDelay(attempt: number) {
    return 2 ** attempt * delayMultiplier; // 1000, 2000, 4000
  }
});

export default function fetchWrapper<T>(url: RequestInfo, init?: RequestInitWithRetry): Promise<T> {
  return fetchAndRetry(url, init).then((r) => transformResponse(r as unknown as Response)) as Promise<T>;
}
