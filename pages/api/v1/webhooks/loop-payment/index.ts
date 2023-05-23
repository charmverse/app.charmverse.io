import type { NextApiRequest, NextApiResponse } from 'next';

export async function loopPayment(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).end();
}
