import { prisma } from '@charmverse/core';
import type { Space } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { onError, onNoMatch, requireSpaceMembership, ActionNotPermittedError } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { updateSpace } from 'lib/spaces/updateSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .put(updateSpaceController)
  .delete(deleteSpace);

async function updateSpaceController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const spaceId = req.query.id as string;

  const updatedSpace = await updateSpace(spaceId, req.body);

  res.status(200).send(updatedSpace);
}

async function deleteSpace(req: NextApiRequest, res: NextApiResponse) {
  await prisma.space.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
