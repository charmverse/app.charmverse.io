import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { canEditPost } from 'lib/forums/posts/canEditPost';
import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

// TODO - Update posts
async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await canEditPost({
    postId,
    userId
  });

  await updateForumPost(postId, req.body);

  res.status(200).end();
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await canEditPost({
    postId,
    userId
  });

  await deleteForumPost(postId);

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  const page = await getForumPost({ userId, pageId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  // if (page.post.status === 'draft' && page.createdBy !== userId) {
  //   throw new UnauthorisedActionError();
  // }

  res.status(200).json(page);
}

export default withSessionRoute(handler);
