import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { publishForumPost } from 'lib/forums/posts/publishForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishForumPostHandler);

// TODO - Update posts
async function publishForumPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId,
    userId
  });

  await publishForumPost(postId);

  res.status(200).json({});
}

export default withSessionRoute(handler);
