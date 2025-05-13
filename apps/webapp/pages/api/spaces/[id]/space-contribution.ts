import { withSessionRoute } from '@root/lib/session/withSession';
import type { CreateSpaceContributionRequest } from '@root/lib/spaces/createSpaceContribution';
import { createSpaceContribution } from '@root/lib/spaces/createSpaceContribution';
import type { SpaceReceipt } from '@root/lib/spaces/getSpaceReceipts';
import { getSpaceReceipts } from '@root/lib/spaces/getSpaceReceipts';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(createSpaceContributionController)
  .get(getSpaceContributionsController);

async function createSpaceContributionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  const spaceContribution = await createSpaceContribution({
    ...(req.body as CreateSpaceContributionRequest),
    spaceId,
    userId
  });

  res.status(200).json(spaceContribution.id);
}

async function getSpaceContributionsController(req: NextApiRequest, res: NextApiResponse<SpaceReceipt[]>) {
  const { id: spaceId } = req.query as { id: string };
  const spaceReceipts = await getSpaceReceipts(spaceId);

  res.status(200).json(spaceReceipts);
}

export default withSessionRoute(handler);
