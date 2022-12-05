import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getPostComments } from 'lib/forums/comments/getPostComments';
import type { PostCommentWithVote } from 'lib/forums/comments/interface';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostCommentsHandler);

async function getForumPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const postCommentsWithVotes = await getPostComments({ postId, userId });

  res.status(200).json(postCommentsWithVotes);
}

export default withSessionRoute(handler);
