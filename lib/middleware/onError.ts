import { NextApiRequest, NextApiResponse } from 'next';
import log from 'lib/log';
import { SystemError } from 'lib/utilities/errors';
import { UnknownError } from 'lib/middleware';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {

  if (err instanceof SystemError) {

    let errorCode = 400;

    if (err.errorType === 'Access denied') {
      errorCode = 401;
    }
    else if (err.errorType === 'Unknown' || err.severity === 'error') {
      errorCode = 500;
      log.error(`Server Error: ${err.error || err}`, {
        userId: req.session?.user?.id,
        url: req.url,
        body: req.body
      });
    }

    res.status(errorCode).json(err);
  }
  else {

    const errorContent = (err.stack ?? err.error) ?? err;

    log.error(`Server Error: ${errorContent}`, {
      userId: req.session?.user?.id,
      url: req.url,
      body: req.body
    });

    res.status(500).json(new UnknownError(errorContent));

  }

}

export default onError;
