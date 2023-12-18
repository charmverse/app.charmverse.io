import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { isProposalReviewer } from 'lib/proposal/isProposalReviewer';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .use(requireUser)
  .get(getReviewerIds);

async function getReviewerIds(req: NextApiRequest, res: NextApiResponse<boolean>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.view) {
    throw new ActionNotPermittedError(`You cannot view this proposal`);
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      id: true,
      spaceId: true,
      space: {
        select: {
          id: true,
          paidTier: true
        }
      },
      reviewers: true
    }
  });

  const isReviewer = await isProposalReviewer({ proposal, userId, checkRoles: proposal.space.paidTier !== 'free' });

  return res.status(200).send(isReviewer);
}

export default withSessionRoute(handler);
