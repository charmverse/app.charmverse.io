import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).get(exportSpaceData);

async function exportSpaceData(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const jsZip = await import('jszip');

  await jsZip.file;
  const userId = req.session.user.id;

  const sortedSpaces = await getSpacesOfUser(userId);

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json(sortedSpaces);
}
export default withSessionRoute(handler);
