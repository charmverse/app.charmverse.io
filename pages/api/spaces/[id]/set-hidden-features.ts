import type { Space } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { setHiddenFeatures } from 'lib/spaces/setHiddenFeatures';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(setHiddenFeaturesController);

async function setHiddenFeaturesController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;

  const updatedSpace = await setHiddenFeatures({
    hiddenFeatures: req.body.hiddenFeatures,
    spaceId: spaceId as string
  });
  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
