import { UnauthorisedActionError, InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ArchiveProposalRequest } from 'lib/proposals/archiveProposals';
import { archiveProposals } from 'lib/proposals/archiveProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(archiveProposalController);

async function archiveProposalController(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { archived } = req.body as ArchiveProposalRequest;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (typeof archived !== 'boolean') {
    throw new InvalidInputError(`Property "archived" must be true or false`);
  }
  if (archived === true && !permissions.archive) {
    throw new UnauthorisedActionError(`You cannot archive this proposal`);
  } else if (archived === false && !permissions.unarchive) {
    throw new UnauthorisedActionError(`You cannot unarchive this proposal`);
  }

  await archiveProposals({
    archived,
    proposalIds: [proposalId],
    actorId: userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
