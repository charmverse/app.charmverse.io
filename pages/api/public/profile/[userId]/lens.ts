import type { ProfileFragment } from '@lens-protocol/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getDefaultLensProfile } from 'lib/profile/getDefaultLensProfile';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getLensProfileController);

async function getLensProfileController(req: NextApiRequest, res: NextApiResponse<ProfileFragment | null>) {
  const userId = req.query.userId as string;

  const defaultLensProfile = await getDefaultLensProfile(userId);

  res.status(200).json(defaultLensProfile);
}

export default handler;
