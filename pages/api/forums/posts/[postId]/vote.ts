import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { ForumPostPageVote } from 'lib/forums/posts/interfaces';
import { voteForumPost } from 'lib/forums/posts/voteForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(voteForumPostHandler);

async function voteForumPostHandler(req: NextApiRequest, res: NextApiResponse<ForumPostPageVote>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;
  const { upvoted } = req.body;

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      page: {
        select: {
          spaceId: true,
          createdBy: true,
          id: true
        }
      }
    }
  });

  if (!post || !post.page) {
    throw new PageNotFoundError(postId);
  }

  const forumPostPageVote = await voteForumPost({
    pageId: post.page.id,
    userId,
    upvoted
  });

  res.status(200).json(forumPostPageVote);
}

export default withSessionRoute(handler);
