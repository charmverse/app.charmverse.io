import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getSummonProfile } from 'lib/profile/getSummonProfile';
import type { SummonUserProfile } from 'lib/summon/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getSummonProfileController);

async function getSummonProfileController(req: NextApiRequest, res: NextApiResponse<SummonUserProfile | null>) {
  const userId = req.query.userId as string;

  const summonProfile = await getSummonProfile({ userId });

  res.status(200).json(summonProfile);
}

export default handler;
