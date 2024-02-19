import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, requireUser, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getOrCreateReviewerNotes } from 'lib/proposal/getOrCreateReviewerNotes';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getOrCreateReviewerNotesId);

// for submitting a review or removing a previous one
async function getOrCreateReviewerNotesId(req: NextApiRequest, res: NextApiResponse) {
  const { pageId, proposalId: queryProposalId } = req.query as { pageId?: string; proposalId?: string };
  let proposalId = queryProposalId as string;
  const userId = req.session.user.id;
  if (pageId && !queryProposalId) {
    const { proposalId: pageProposalId } = await prisma.page.findUniqueOrThrow({
      where: {
        id: pageId
      },
      select: {
        proposalId: true
      }
    });
    proposalId = pageProposalId!;
  } else {
    throw new InvalidInputError('Missing pageId or proposalId');
  }
  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });
  if (!proposalPermissions.view_notes) {
    throw new ActionNotPermittedError(`You don't have permission to view reviewer notes`);
  }
  const result = await getOrCreateReviewerNotes({
    proposalId,
    userId
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
