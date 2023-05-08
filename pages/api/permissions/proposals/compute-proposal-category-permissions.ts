import type { ProposalCategoryPermissionFlags } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'resourceId', location: 'body', resourceIdType: 'proposal' }))
  .post(computePermissions);

async function computePermissions(req: NextApiRequest, res: NextApiResponse<ProposalCategoryPermissionFlags>) {
  const input = req.body as PermissionCompute;

  const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
    resourceId: input.resourceId,
    userId: req.session.user?.id
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
