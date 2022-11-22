
import path from 'node:path';

import type { Prisma, Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logSpaceCreation } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { convertJsonPagesToPrisma } from 'lib/pages/server/convertJsonPagesToPrisma';
import { createPage } from 'lib/pages/server/createPage';
import { setupDefaultPaymentMethods } from 'lib/payment-methods/defaultPaymentMethods';
import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { generateDefaultCategoriesInput } from 'lib/proposal/generateDefaultCategoriesInput';
import { withSessionRoute } from 'lib/session/withSession';
import { createWorkspace } from 'lib/spaces/createWorkspace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaces).post(createSpace);

async function getSpaces (req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const userId = req.session.user.id;

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    include: {
      space: true
    }
  });
  const spaces = spaceRoles.map(sr => sr.space);
  return res.status(200).json(spaces);
}

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const userId = req.session.user.id;
  const data = req.body as Prisma.SpaceCreateInput;

  const space = await createWorkspace({ spaceData: data, userId });

  return res.status(200).json(space);
}

export default withSessionRoute(handler);

