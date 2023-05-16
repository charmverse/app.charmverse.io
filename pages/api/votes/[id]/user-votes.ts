import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import type { UserVoteExtendedDTO } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getUserVotes);

async function getUserVotes(req: NextApiRequest, res: NextApiResponse<UserVoteExtendedDTO[] | { error: any }>) {
  const voteId = req.query.id as string;

  const vote = await prisma.vote.findFirst({
    where: {
      id: voteId
    },
    select: {
      page: {
        select: {
          id: true
        }
      }
    }
  });

  if (!vote || !vote.page) {
    throw new NotFoundError('Vote not found');
  }

  const computed = await computeUserPagePermissions({
    resourceId: vote.page.id,
    userId: req.session?.user?.id
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

  const userVotes = await prisma.userVote.findMany({
    where: {
      voteId
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  });

  return res.status(200).json(userVotes);
}

export default withSessionRoute(handler);
