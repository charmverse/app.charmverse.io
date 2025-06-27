import { UnauthorisedActionError, InvalidInputError } from '@packages/core/errors';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { ArchiveProposalRequest } from '@packages/lib/proposals/archiveProposals';
import { archiveProposals } from '@packages/lib/proposals/archiveProposals';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(archiveProposalController);

async function archiveProposalController(req: NextApiRequest, res: NextApiResponse) {
  const { proposalIds, archived } = req.body as ArchiveProposalRequest;
  const userId = req.session.user.id;

  for (const proposalId of proposalIds) {
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
  }

  await archiveProposals({
    archived,
    proposalIds,
    actorId: userId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
