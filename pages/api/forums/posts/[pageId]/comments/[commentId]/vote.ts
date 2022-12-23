import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { voteForumComment } from 'lib/forums/posts/voteForumComment';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(commentUpDownVoteHandler);

async function commentUpDownVoteHandler(req: NextApiRequest, res: NextApiResponse) {
  const { pageId, commentId } = req.query as any as { pageId: string; commentId: string };
  const userId = req.session.user.id;
  const { upvoted } = req.body;

  await voteForumComment({
    pageId,
    userId,
    upvoted,
    commentId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
