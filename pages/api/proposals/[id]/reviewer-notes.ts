import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, requireUser, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getOrCreateReviewerNotes } from 'lib/proposal/getOrCreateReviewerNotes';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getOrCreateReviewerNotesId);

// for submitting a review or removing a previous one
async function getOrCreateReviewerNotesId(req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });
  if (!proposalPermissions.evaluate) {
    throw new ActionNotPermittedError(`You don't have permission to view reviewer notes`);
  }
  const result = await getOrCreateReviewerNotes({
    proposalId,
    userId
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
