import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { Game7Inventory } from 'lib/profile/getGame7Profile';
import { getGame7Profile } from 'lib/profile/getGame7Profile';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getGame7ProfileController);

async function getGame7ProfileController(req: NextApiRequest, res: NextApiResponse<Game7Inventory | null>) {
  const userId = req.query.userId as string;

  const game7Profile = await getGame7Profile({ userId });

  res.status(200).json(game7Profile);
}

export default handler;
