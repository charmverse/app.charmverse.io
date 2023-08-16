import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { getAllReviewerUserIds } from 'lib/proposal/getAllReviewerIds';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .use(requireUser)
  .get(getReviewerIds);

async function getReviewerIds(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.view) {
    throw new ActionNotPermittedError(`You cannot view this proposal`);
  }

  const reviewerIds = await getAllReviewerUserIds({ proposalId });

  return res.status(200).send(reviewerIds);
}

export default withSessionRoute(handler);
