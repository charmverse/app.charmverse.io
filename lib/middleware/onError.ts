import { NextApiRequest, NextApiResponse } from 'next';
import log from 'lib/log';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {
  log.error(`Server Error: ${err.stack || err}`);
  res.status(500).json({ error: 'Something went wrong!' });
}

export default onError;
