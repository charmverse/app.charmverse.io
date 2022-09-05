
import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updateProposalStatus } from 'lib/proposal/updateProposalStatus';
import { validateProposalStatusTransition } from 'lib/proposal/validateProposalStatusTransition';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['newStatus'], 'body'))
  .put(updateProposalStatusController);

async function updateProposalStatusController (req: NextApiRequest, res: NextApiResponse<{newStatus: ProposalStatus}>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const newStatus = req.body.newStatus as ProposalStatus;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  const isUserAuthorizedToUpdateProposalStatus = validateProposalStatusTransition({
    authors: proposal.authors,
    currentStatus: proposal.status,
    newStatus,
    reviewers: proposal.reviewers,
    spaceId: proposal.spaceId,
    userId
  });

  if (!isUserAuthorizedToUpdateProposalStatus) {
    throw new UnauthorisedActionError();
  }

  // Going from review to review, mark the reviewer in the proposal
  if (proposal.status === 'review' && newStatus === 'reviewed') {
    await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        reviewer: {
          connect: {
            id: userId
          }
        },
        reviewedAt: new Date()
      }
    });
  }

  await updateProposalStatus({
    currentStatus: proposal.status,
    newStatus,
    proposalId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
