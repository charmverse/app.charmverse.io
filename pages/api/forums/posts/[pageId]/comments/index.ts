import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createPostComment } from 'lib/forums/comments/createPostComment';
import { getPostComments } from 'lib/forums/comments/getPostComments';
import type { CreatePostCommentInput, PostCommentWithVote } from 'lib/forums/comments/interface';
import { checkPostAccess } from 'lib/forums/posts/checkPostAccess';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getPostCommentsHandler).post(createPostCommentHandler);

async function getPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { pageId } = req.query as any as { pageId: string };
  const userId = req.session.user.id;

  const postCommentsWithVotes = await getPostComments({ postId: pageId, userId });

  res.status(200).json(postCommentsWithVotes);
}

async function createPostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote>) {
  const { pageId } = req.query as any as { pageId: string };
  const body = req.body as CreatePostCommentInput;
  const userId = req.session.user.id;

  const page = await checkPostAccess({
    postId: pageId,
    userId
  });

  if (page.post.status === 'draft') {
    throw new UndesirableOperationError("Can't create comment on drafted posts");
  }

  const postComment = await createPostComment({ postId: pageId, userId, ...body });

  res.status(200).json({
    ...postComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
