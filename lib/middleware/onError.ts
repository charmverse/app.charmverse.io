import { NextApiRequest, NextApiResponse } from 'next';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse) {
  console.error('API Error', err.stack || err);
  res.status(500).json({ error: 'Something went wrong!' });
}

export default onError;
