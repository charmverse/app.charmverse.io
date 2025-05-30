import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SpaceResult } from 'lib/admin/getSpaces';
import { getSpaces } from 'lib/admin/getSpaces';
import { whitelist } from 'lib/admin/users';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpacesEndpoint);

async function getSpacesEndpoint(req: NextApiRequest, res: NextApiResponse<SpaceResult[]>) {
  const userId = req.session?.user?.id;

  if (!whitelist.includes(userId)) {
    throw new UnauthorisedActionError('You do not have permission to access this api');
  }
  const result = await getSpaces({
    ...req.query,
    hasSubscriptionMonthlyPrice: req.query.hasSubscriptionMonthlyPrice === 'true'
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
