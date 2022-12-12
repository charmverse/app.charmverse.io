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

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

// TODO - Update posts
async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<ForumPostPage>) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId: pageId,
    userId
  });

  const updatedPost = await updateForumPost({ userId, postId: pageId, ...req.body });

  res.status(200).json(updatedPost);
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  await checkPostAccess({
    postId: pageId,
    userId
  });

  await deleteForumPost(pageId);

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<ForumPostPage>) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  const page = await getForumPost({ userId, postId: pageId });

  if (!page || !page.post) {
    throw new PageNotFoundError(pageId);
  }

  // if (page.post.status === 'draft' && page.createdBy !== userId) {
  //   throw new UnauthorisedActionError();
  // }

  res.status(200).json(page);
}

export default withSessionRoute(handler);
