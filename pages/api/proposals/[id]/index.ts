
import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { updateProposal } from 'lib/proposal/updateProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(updateProposalController)
  .get(getProposalController);

async function getProposalController (req: NextApiRequest, res: NextApiResponse<ProposalWithUsers>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  const computed = await computeUserPagePermissions({
    // Proposal id is the same as page
    pageId: proposal?.id,
    userId
  });

  if (computed.read !== true) {
    throw new NotFoundError();
  }

  return res.status(200).json(proposal);
}

async function updateProposalController (req: NextApiRequest, res: NextApiResponse) {

  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const { authors, reviewers } = req.body;

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

  const isCurrentUserProposalAuthor = proposal.authors.some(author => author.userId === userId);

  // A proposal can only be updated when its in private_draft, draft or discussion status and only the proposal author can update it
  if (!isCurrentUserProposalAuthor || (proposal.status !== 'discussion' && proposal.status !== 'private_draft' && proposal.status !== 'draft')) {
    throw new UnauthorisedActionError();
  }

  await updateProposal({ proposalId: proposal.id, authors, reviewers });

  return res.status(200).end();
}

export default withSessionRoute(handler);
