import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { SpaceDefaultPublicPageToggle } from 'lib/permissions/pages';
import { toggleSpaceDefaultPublicPage } from 'lib/permissions/pages/actions/toggleSpaceDefaultPublicPage';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(setSpaceDefaultPublicPage);

async function setSpaceDefaultPublicPage(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { defaultPublicPages } = req.body as Pick<SpaceDefaultPublicPageToggle, 'defaultPublicPages'>;

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id as string,
    spaceId: spaceId as string,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const updatedSpace = await toggleSpaceDefaultPublicPage({
    defaultPublicPages,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
