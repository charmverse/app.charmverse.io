import { DataNotFoundError, SystemError, UnknownError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { IronSession } from 'iron-session';
import { headers } from 'next/headers';
import type { ServerErrorFunctionUtils } from 'next-safe-action';

import { isSystemError } from '../utils/isSystemError';

import type { defineMetadataSchema } from './actionClient';

type ErrorResponse = Omit<SystemError, 'error' | 'errorConstructor' | 'name'>;

type MaybePromise<T> = Promise<T> | T;

type MetadataSchema = ReturnType<typeof defineMetadataSchema>;

export function handleReturnedServerError(
  err: any,
  _utils: ServerErrorFunctionUtils<MetadataSchema>
): MaybePromise<ErrorResponse> {
  // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
  // P2025 is thrown when a record is not found
  if (err.code === 'P2025') {
    const error = new DataNotFoundError('Data not found');

    return {
      message: error.message,
      errorType: error.errorType,
      severity: error.severity,
      code: error.code
    };
  }

  const isValidSystemError = isSystemError(err);

  const errorAsSystemError = isValidSystemError ? err : new UnknownError(err.stack ?? err.error ?? err);

  if (err.message && !isValidSystemError) {
    errorAsSystemError.message = err.message;
  }

  const { stack, error, errorConstructor, ...withoutStack } = errorAsSystemError;

  return withoutStack;
}

export function handleServerErrorLog(
  err: any,
  utils: ServerErrorFunctionUtils<MetadataSchema> & {
    returnedError: ErrorResponse;
  }
): MaybePromise<void> {
  const clientInput = utils?.clientInput;
  const metadata = utils?.metadata;
  const ctx = utils?.ctx;

  // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
  // P2025 is thrown when a record is not found
  if (err.code === 'P2025') {
    log.error(`Server Error: ${err.message || err.error?.message || err.error || err}`, { error: err });
  }

  const context = ctx as {
    session: IronSession<SessionData>;
    headers: ReturnType<typeof headers>;
  };
  const userId = context?.session?.user?.id;

  const headersList = headers();
  const fullUrl = headersList.get('referer') || '';

  const isValidSystemError = isSystemError(err);

  const errorAsSystemError = isValidSystemError ? err : new UnknownError(err.stack ?? err.error ?? err);

  const loggedInfo = {
    error: err instanceof SystemError === false ? err.message || 'Something went wrong' : errorAsSystemError,
    stack: err.error?.stack || err.stack,
    userId,
    projectId: '',
    url: fullUrl,
    body: clientInput,
    metadata
  };

  if (errorAsSystemError.code === 500) {
    log.error(`Server Error: ${err.message || err.error?.message || err.error || err}`, loggedInfo);
  } else {
    log.warn(`Client Error: ${errorAsSystemError.message}`, loggedInfo);
  }
}
