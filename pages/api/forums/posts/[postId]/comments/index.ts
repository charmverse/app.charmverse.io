import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import { getPostComments } from 'lib/forums/comments/getPostComments';
import type { CreatePageCommentInput, PostCommentWithVote } from 'lib/forums/comments/interface';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getPostCommentsHandler).post(createPostCommentHandler);

async function getPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const postCommentsWithVotes = await getPostComments({ postId, userId });

  res.status(200).json(postCommentsWithVotes);
}

async function createPostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote>) {
  const { postId } = req.query as any as { postId: string };
  const body = req.body as CreatePageCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      page: {
        select: {
          spaceId: true
        }
      },
      status: true
    }
  });

  if (!post || !post.page) {
    throw new PageNotFoundError(postId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: post.page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  if (post.status === 'draft') {
    throw new UndesirableOperationError("Can't create comment on drafted posts");
  }

  const postComment = await createPostComment({ postId, userId, ...body });

  res.status(200).json({
    ...postComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
