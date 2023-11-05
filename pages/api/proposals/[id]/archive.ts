import { UnauthorisedActionError } from '@charmverse/core/errors';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import { archiveProposal } from 'lib/proposal/archiveProposal';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(providePermissionClients({ key: 'id', location: 'query', resourceIdType: 'proposal' }))
  .use(requireUser)
  .post(archiveProposalController);

async function archiveProposalController(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { archived } = req.body as ArchiveProposalRequest;

  const permissions = await req.basePermissionsClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (archived === true && !permissions.archive) {
    throw new UnauthorisedActionError(`You cannot archive this proposal`);
  } else if (archived === false && !permissions.unarchive) {
    throw new UnauthorisedActionError(`You cannot unarchive this proposal`);
  }

  const updatedProposal = await archiveProposal({
    archived,
    proposalId
  });

  return res.status(200).send(updatedProposal);
}

export default withSessionRoute(handler);
