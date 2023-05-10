import type { ProposalFlowPermissionFlags } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .use(requireUser)
  .get(getFlowFlagsController);

async function getFlowFlagsController(req: NextApiRequest, res: NextApiResponse<ProposalFlowPermissionFlags>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const flowFlags = await req.basePermissionsClient.proposals.computeProposalFlowPermissions({
    resourceId: proposalId,
    userId
  });
  return res.status(200).send(flowFlags);
}

export default withSessionRoute(handler);
