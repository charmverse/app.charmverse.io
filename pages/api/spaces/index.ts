import { UnauthorisedActionError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma';
import { replaceS3Domain } from '@packages/utils/url';
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
import { checkUserBlacklistStatus } from 'lib/users/checkUserBlacklistStatus';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const userId = req.session.user.id;

  const sortedSpaces = await getSpacesOfUser(userId);

  res.setHeader('Cache-Control', 'no-store');

  sortedSpaces.forEach((space) => {
    space.spaceImage = replaceS3Domain(space.spaceImage);
  });

  return res.status(200).json(sortedSpaces);
}

async function createSpace(req: NextApiRequest, res: NextApiResponse<Space>) {
  const userId = req.session.user.id;
  const data = req.body as CreateSpaceProps;
  const isBlacklisted = await checkUserBlacklistStatus(userId);
  if (isBlacklisted) {
    throw new UnauthorisedActionError('This account has been blocked');
  }
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
