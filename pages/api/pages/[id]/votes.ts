import { prisma } from 'db';
import { ExtendedVote, getPageVotes } from 'lib/votes';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const pageId = req.query.id as string;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      space: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const { error } = await hasAccessToSpace({
    userId: req.session.user.id,
    spaceId: page.spaceId as string,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const votes = await getPageVotes(pageId);

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
