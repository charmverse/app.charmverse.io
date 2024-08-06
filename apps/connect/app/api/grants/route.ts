import type { NextApiRequest, NextApiResponse } from 'next';

import { getGrants } from 'lib/grants/getGrants';

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const cursor = (req.query.cursor as string) || null;
  const sort = (req.query.sort || 'new') as 'new' | 'upcoming';
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const grants = await getGrants({
    sort,
    cursor,
    limit
  });

  res.status(200).json(grants);
}
