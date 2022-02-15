import { NextApiRequest, NextApiResponse } from 'next';

export function onError (err: any, req: NextApiRequest, res: NextApiResponse, next: Function) {
  console.error('API Error', err.stack || err);
  res.status(500).json({ error: 'Something went wrong!' });
}

export default onError;
