import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

// TODO - Update posts
async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<ForumPostPage>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId,
    userId
  });

  const updatedPost = await updateForumPost(postId, req.body);

  res.status(200).json(updatedPost);
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId,
    userId
  });

  await deleteForumPost(postId);

  res.status(200).json({});
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const page = await getForumPost(postId);

  if (!page || !page.post) {
    throw new PageNotFoundError(postId);
  }

  if (page.post.status === 'draft' && page.createdBy !== userId) {
    throw new UnauthorisedActionError();
  }

  res.status(200).json(page.post);
}

export default withSessionRoute(handler);
