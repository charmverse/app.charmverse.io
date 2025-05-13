import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateSpaceContributionRequest } from 'lib/spaces/createSpaceContribution';
import { createSpaceContribution } from 'lib/spaces/createSpaceContribution';
import type { SpaceReceipt } from 'lib/spaces/getSpaceReceipts';
import { getSpaceReceipts } from 'lib/spaces/getSpaceReceipts';

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
