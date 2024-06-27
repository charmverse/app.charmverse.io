import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';

import { DataNotFoundError, SystemError } from 'lib/utils/errors';

import { UnknownError } from './errors';
import { removeApiKeyFromQuery } from './removeApiKeyFromQuery';

const validationProps: (keyof SystemError)[] = ['errorType', 'message', 'severity', 'code'];

export function onError(err: any, req: NextApiRequest, res: NextApiResponse) {
  // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
  // P2025 is thrown when a record is not found
  if (err.code === 'P2025') {
    return res.status(404).json(new DataNotFoundError(`Data not found`));
  }

  // We need to change strategy to validate the error since Prototypes are not always correct
  const isValidSystemError =
    validationProps.every((prop) => !!err[prop]) && typeof err.code === 'number' && err.code >= 400 && err.code <= 599;

  const errorAsSystemError = isValidSystemError ? err : new UnknownError(err.stack ?? err.error ?? err);

  if (errorAsSystemError.code === 500) {
    // err.error?.message is for errors from @charmverse/core/http
    log.error(`Server Error: ${err.message || err.error?.message || err.error || err}`, {
      error: err instanceof SystemError === false ? err.message || 'Something went wrong' : errorAsSystemError,
      stack: err.error?.stack || err.stack,
      userId: req.session?.user?.id,
      pageId: req.query?.pageId || req.body?.pageId,
      spaceId: req.query?.spaceId || req.body?.spaceId,
      url: removeApiKeyFromQuery(req.url ?? ''),
      body: req.body
    });
  } else {
    log.warn(`Client Error: ${errorAsSystemError.message}`, {
      url: removeApiKeyFromQuery(req.url ?? ''),
      body: req.body,
      userId: req.session?.user?.id,
      pageId: req.query?.pageId || req.body?.pageId,
      spaceId: req.query?.spaceId || req.body?.spaceId
    });
  }

  const { stack, message, ...withoutStack } = errorAsSystemError;

  res.status(errorAsSystemError.code).json({ ...withoutStack, message });
}

export default onError;
