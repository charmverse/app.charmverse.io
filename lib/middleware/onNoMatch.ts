import type { NextApiRequest, NextApiResponse } from 'next';

export function onNoMatch(req: NextApiRequest, res: NextApiResponse) {
  res.status(405).send('Method not allowed');
}

export default onNoMatch;
