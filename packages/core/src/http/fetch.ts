import type { FetchLibrary, RequestInitWithRetry } from 'fetch-retry';
import fetchRetry from 'fetch-retry';
import { fetch as nativeFetch } from 'undici';

import { HTTPFetchError } from './errors';

const delayMultiplier = process.env.NODE_ENV === 'test' ? 1 : 1000;

const fetchAndRetry = fetchRetry<FetchLibrary>(nativeFetch as any, {
  retries: 5,
  retryOn: [500, 501, 502, 503],
  retryDelay(attempt: number) {
    return 2 ** attempt * delayMultiplier; // 1000, 2000, 4000
  }
});

export async function transformResponse(response: Response) {
  const contentType = response.headers.get('content-type');

  if (response.status >= 400) {
    // necessary to capture the regular response for embedded blocks
    if (contentType?.includes('application/json')) {
      try {
        const jsonResponse = await response.json();
        return Promise.reject({ status: response.status, message: response.statusText, ...jsonResponse });
      } catch (error) {
        // not valid JSON, content-type is lying!
      }
    }
    // Note: 401 if user is logged out
    return response.text().then((text) => Promise.reject({ status: response.status, message: text }));
  }

  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text().then((_response) => {
    // since we expect JSON, dont return the true value for 200 response
    return _response === 'OK' ? null : _response;
  });
}

export default function fetchWrapper<T>(
  url: Parameters<typeof fetch>[0],
  init?: RequestInitWithRetry<FetchLibrary>
): Promise<T> {
  return fetchAndRetry(url, init)
    .then((r) => transformResponse(r as unknown as Response)) //  as Promise<T>
    .catch((e) => {
      if (e.cause) {
        // handle "fetch error"
        return Promise.reject(
          new HTTPFetchError({
            message: e.cause.message,
            requestUrl: url as string,
            method: init?.method || 'GET',
            responseCode: e.cause.code
          })
        );
      }
      throw e;
    });
}
