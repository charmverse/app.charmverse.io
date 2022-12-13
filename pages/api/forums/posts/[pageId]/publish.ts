import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { publishForumPost } from 'lib/forums/posts/publishForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(publishForumPostHandler);

// TODO - Update posts
async function publishForumPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId: pageId,
    userId
  });

  const updatedPost = await publishForumPost(pageId);

  if (updatedPost.page) {
    relay.broadcast(
      {
        type: 'post_published',
        payload: {
          createdBy: updatedPost.page.createdBy,
          categoryId: updatedPost.categoryId
        }
      },
      updatedPost.page.spaceId
    );
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
