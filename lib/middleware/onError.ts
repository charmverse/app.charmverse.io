import { NextApiRequest, NextApiResponse } from 'next';
import log from 'lib/log';
import { SystemError } from 'lib/utilities/errors';
import { UnknownError } from 'lib/middleware';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {

  if (!(err instanceof SystemError)) {

    err = new UnknownError((err.stack ?? err.error) ?? err);
  }

  if (err.code === 500) {
    console.log('error', err);
    log.error(`Server Error: ${err.error || err.message || err}`, {
      error: err,
      stack: err.stack,
      userId: req.session?.user?.id,
      url: req.url,
      body: req.body
    });
  }

  res.status(err.code).json(err);

}

export default onError;
