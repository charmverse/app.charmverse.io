import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler (req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'PATCH') {
    res.status(200).end();
  }
}
