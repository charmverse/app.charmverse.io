import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
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

  const computed = await permissionsApiClient.pages.computePagePermissions({
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
