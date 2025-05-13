import { InvalidInputError } from '@charmverse/core/errors';
import { getProposalOrApplicationCredentials } from '@packages/credentials/getProposalOrApplicationCredentials';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireUser, requireKeys([{ key: 'proposalId' }], 'query'), getIssuedCredentialsController);

async function getIssuedCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.proposalId as string;
  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId: req.session.user.id as string
  });

  if (!permissions.view) {
    throw new InvalidInputError('User does not have permission to view credentials for this proposal');
  }

  const issuedCredentials = await getProposalOrApplicationCredentials({ proposalId });
  return res.status(200).json(issuedCredentials);
}

export default withSessionRoute(handler);
