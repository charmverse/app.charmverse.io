
import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { openDiscussion } from 'lib/proposal/openDiscussion';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(openDiscussionController);

async function openDiscussionController (req: NextApiRequest, res: NextApiResponse) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  if (!proposal.authors.some(author => author.userId === userId)) {
    throw new UnauthorisedActionError();
  }

  await openDiscussion(proposal);

  return res.status(200).end();
}

export default withSessionRoute(handler);
