import type { EnsProfile } from '@packages/profile/getEnsProfile';
import { getEnsProfile } from '@packages/profile/getEnsProfile';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getEnsProfileController);

async function getEnsProfileController(req: NextApiRequest, res: NextApiResponse<EnsProfile | null>) {
  const userId = req.query.userId as string;

  const ensProfile = await getEnsProfile({ userId });

  res.status(200).json(ensProfile);
}

export default handler;
