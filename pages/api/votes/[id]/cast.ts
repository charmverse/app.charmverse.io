
import type { UserVote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { castVote as castVoteService } from 'lib/votes';
import type { UserVoteDTO } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['choice'], 'body'))
  .post(castVote);

async function castVote (req: NextApiRequest, res: NextApiResponse<UserVote | { error: any }>) {
  const { choice } = req.body as UserVoteDTO;
  const voteId = req.query.id as string;
  const userId = req.session.user.id;

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    include: {
      voteOptions: true
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`A vote with id ${voteId} was not found.`);
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: vote.spaceId
  });

  if (error) {
    throw error;
  }

  const newUserVote: UserVote = await castVoteService(choice, vote, userId);

  if (vote.context === 'proposal') {
    trackUserAction('user_cast_a_vote', { userId, spaceId: vote.spaceId, pageId: vote.pageId, resourceId: vote.id, platform: 'charmverse' });
  }

  return res.status(200).json(newUserVote);
}

export default withSessionRoute(handler);
