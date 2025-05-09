import { InvalidInputError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { toggleRequireProposalTemplate } from 'lib/spaces/toggleRequireProposalTemplate';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(setRequireProposalTemplatesController);

async function setRequireProposalTemplatesController(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { requireProposalTemplate } = req.body as { requireProposalTemplate: boolean };

  if (typeof requireProposalTemplate !== 'boolean') {
    throw new InvalidInputError('Public must be a boolean.');
  }
  const updatedSpace = await toggleRequireProposalTemplate({
    requireProposalTemplate,
    spaceId: spaceId as string
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
