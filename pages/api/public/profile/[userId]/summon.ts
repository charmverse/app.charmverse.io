import { InvalidInputError } from '@charmverse/core/errors';
import { getSummonProfile } from '@packages/profile/getSummonProfile';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { SummonUserProfile } from 'lib/summon/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getSummonProfileController);

async function getSummonProfileController(req: NextApiRequest, res: NextApiResponse<SummonUserProfile | null>) {
  const userId = req.query.userId as string;
  const spaceId = req.query.spaceId as string;
  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const summonProfile = await getSummonProfile({ userId, spaceId });

  res.status(200).json(summonProfile);
}

export default handler;
