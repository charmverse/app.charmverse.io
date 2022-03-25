import { NextApiRequest, NextApiResponse } from 'next';
import log from 'lib/log';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {
  log.error(`Server Error: ${err.stack || err}`, {
    userId: req.session?.user?.id,
    url: req.url,
    body: req.body
  });
  res.status(500).json({ error: 'Something went wrong!' });
}

export default onError;
