import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceAdditionalBlockCount } from 'lib/spaces/getSpaceAdditionalBlockCount';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getAdditionalBlockQuota);

async function getAdditionalBlockQuota(req: NextApiRequest, res: NextApiResponse<number>) {
  const spaceId = req.query.id as string;

  const additionalBlockCount = await getSpaceAdditionalBlockCount({ spaceId });

  res.status(200).send(additionalBlockCount);
}

export default withSessionRoute(handler);
