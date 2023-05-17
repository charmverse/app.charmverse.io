import type { ProposalReviewerPool, Resource } from '@charmverse/core';
import { ProposalNotFoundError, hasAccessToSpace } from '@charmverse/core';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { SpaceMembershipRequiredError } from 'lib/permissions/errors';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(providePermissionClients({ key: 'resourceId', location: 'query', resourceIdType: 'proposal' }))
  .get(getReviewerPoolController);

async function getReviewerPoolController(req: NextApiRequest, res: NextApiResponse<ProposalReviewerPool>) {
  const { resourceId } = req.query as Resource;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }

  const { error } = await hasAccessToSpace({
    spaceId: proposal.spaceId,
    userId: req.session.user.id
  });

  if (error) {
    throw new SpaceMembershipRequiredError();
  }

  const reviewerPool = await req.basePermissionsClient.proposals.getProposalReviewerPool({
    resourceId
  });

  return res.status(200).json(reviewerPool);
}

export default withSessionRoute(handler);
