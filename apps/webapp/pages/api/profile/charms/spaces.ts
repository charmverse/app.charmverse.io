import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SpaceCharmsStatus } from '@packages/lib/charms/getSpacesCharmsStatus';
import { getSpacesCharmsStatus } from '@packages/lib/charms/getSpacesCharmsStatus';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpacesCharmsHandler);

async function getSpacesCharmsHandler(req: NextApiRequest, res: NextApiResponse<SpaceCharmsStatus[]>) {
  const userId = req.session.user.id;

  const spacesCharmsDetails = await getSpacesCharmsStatus(userId);

  res.status(200).json(spacesCharmsDetails);
}

export default withSessionRoute(handler);
