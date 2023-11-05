import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CreateSpaceProps } from 'lib/spaces/createSpace';
import { createWorkspace } from 'lib/spaces/createSpace';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const userId = req.session.user.id;

  const sortedSpaces = await getSpacesOfUser(userId);

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json(sortedSpaces);
}

async function createSpace(req: NextApiRequest, res: NextApiResponse<Space>) {
  const userId = req.session.user.id;
  const data = req.body as CreateSpaceProps;

  const space = await createWorkspace({
    spaceData: data.spaceData,
    spaceTemplate: data.spaceTemplate,
    userId
  });
  updateTrackGroupProfile(space);
  updateTrackUserProfileById(userId);
  trackUserAction('create_new_workspace', { userId, spaceId: space.id, template: data.spaceTemplate || 'default' });

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
