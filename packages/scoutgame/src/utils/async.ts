import { UnknownError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { headers } from 'next/headers';

import { getSession } from '../session/getSession';

import { isSystemError } from './isSystemError';

export type MaybePromise<T> = T | Promise<T>;

export async function safeAwait<T>(
  promise: Promise<T>,
  options?: { onSuccess?: (response: T) => MaybePromise<void>; onError?: (error: Error) => MaybePromise<void> }
): Promise<[error: Error] | [error: null, data: T]> {
  try {
    const response = await promise;
    await options?.onSuccess?.(response);
    return [null, response];
  } catch (_error: any) {
    await options?.onError?.(_error);
    return [_error];
  }
}

export async function safeAwaitSSRData<T>(promise: Promise<T>) {
  return safeAwait(promise, {
    onError: async (err) => {
      const session = await getSession();
      const headersList = headers();
      const fullUrl = headersList.get('referer') || '';

      const isValidSystemError = isSystemError(err);

      const errorAsSystemError = isValidSystemError ? err : new UnknownError(err.stack ?? err);

      const loggedInfo = {
        error: errorAsSystemError,
        stack: err.stack,
        userId: session.scoutId,
        url: fullUrl,
        ssr: true // Flag to identify that this error was thrown during SSR and can be looked up in DD
      };

      log.error('Server error fetching SSR data', loggedInfo);
    }
  });
}
