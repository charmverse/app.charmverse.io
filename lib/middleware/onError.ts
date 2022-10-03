import type { NextApiRequest, NextApiResponse } from 'next';

import log from 'lib/log';
import { UnknownError } from 'lib/middleware';
import { SystemError } from 'lib/utilities/errors';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {

  const errorAsSystemError = err instanceof SystemError ? err : new UnknownError((err.stack ?? err.error) ?? err);

  if (errorAsSystemError.code === 500) {

    // console.log('error', err);
    // err.error?.message is for errors from adapters/http/fetch.server
    log.error(`Server Error: ${err.message || err.error?.message || err.error || err}`, {
      error: (err instanceof SystemError) === false ? (err.message || 'Something went wrong') : errorAsSystemError,
      stack: err.error?.stack || err.stack,
      userId: req.session?.user?.id,
      url: req.url,
      body: req.body
    });
  }

  res.status(errorAsSystemError.code).json(errorAsSystemError);

}

export default onError;
