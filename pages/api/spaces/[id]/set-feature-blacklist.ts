import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { setFeatureBlacklist } from 'lib/spaces/setFeatureBlacklist';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(setFeatureBlacklistController);

async function setFeatureBlacklistController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;

  const updatedSpace = await setFeatureBlacklist({
    featureBlacklist: req.body.featureBlacklist,
    spaceId: spaceId as string
  });
  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
