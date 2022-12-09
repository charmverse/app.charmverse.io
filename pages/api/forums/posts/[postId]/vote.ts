import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ForumPostPageVote } from 'lib/forums/posts/interfaces';
import { voteForumPost } from 'lib/forums/posts/voteForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(voteForumPostHandler);

async function voteForumPostHandler(req: NextApiRequest, res: NextApiResponse<ForumPostPageVote>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;
  const { upvoted } = req.body;

  const forumPostPageVote = await voteForumPost({
    pageId: postId,
    userId,
    upvoted
  });

  res.status(200).json(forumPostPageVote);
}

export default withSessionRoute(handler);
