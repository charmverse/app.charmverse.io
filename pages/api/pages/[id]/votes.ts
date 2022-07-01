import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { getPageVotes } from 'lib/votes';
import { ExtendedVote } from 'lib/votes/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const pageId = req.query.id as string;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const votes = await getPageVotes(pageId);

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
