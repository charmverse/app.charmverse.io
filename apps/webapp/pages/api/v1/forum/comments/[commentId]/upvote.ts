import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { UnauthorisedActionError } from '@packages/core/errors';
import { voteForumComment } from '@packages/lib/forums/posts/voteForumComment';
import { requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { superApiHandler } from 'lib/public-api/handler';
import { userProfileSelect, getUserProfile } from 'lib/public-api/searchUserProfile';

import type { PublicApiPostComment } from '../../posts/[postId]/comments/index';

const handler = superApiHandler();

handler.post(requireKeys(['userId', 'upvoted'], 'body'), upvoteOnComment);

/**
 * @swagger
 * /forum/comments/{commentId}/upvote:
 *   post:
 *     summary: Up/downvote a post comment
 *     description: Adds a vote for a post comment by a specific user
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: commentId
 *         in: params
 *         required: true
 *         type: string
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/UpvoteInput'
 *     responses:
 *       200:
 *         description: Comment where the vote was made with refreshed vote count
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPostComment'
 *
 */
async function upvoteOnComment(req: NextApiRequest, res: NextApiResponse<PublicApiPostComment>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const userId = req.body.userId as string;
  const commentId = req.query.commentId as string;

  if (!userId || !commentId) {
    throw new InvalidInputError('User ID or comment ID is undefined');
  }

  const { postId } = await prisma.postComment.findFirstOrThrow({
    where: {
      id: commentId,
      post: {
        spaceId: {
          in: req.spaceIdRange
        }
      }
    },
    select: {
      postId: true
    }
  });

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId: {
        in: req.spaceIdRange
      },
      userId
    }
  });

  if (!spaceRole) {
    throw new UnauthorisedActionError('User does not have access to this space');
  }

  await voteForumComment({
    upvoted: !!req.body.upvoted,
    commentId,
    postId,
    userId
  });

  const comment = await prisma.postComment.findUniqueOrThrow({
    where: {
      id: commentId
    },
    include: {
      votes: {
        select: {
          upvoted: true
        }
      },
      user: { select: userProfileSelect }
    }
  });

  const parsedContent = await generateMarkdown({
    content: comment.content
  });

  const { upvotes, downvotes } = comment.votes.reduce(
    (acc, val) => {
      if (val.upvoted) {
        acc.upvotes += 1;
      } else if (val.upvoted === false) {
        acc.downvotes += 1;
      }
      return acc;
    },
    { upvotes: 0, downvotes: 0 }
  );

  return res.status(200).json({
    id: comment.id,
    author: getUserProfile(comment.user),
    createdAt: comment.createdAt.toISOString(),
    parentId: comment.parentId,
    content: {
      markdown: parsedContent,
      text: comment.contentText
    },
    upvotes,
    downvotes,
    children: []
  });
}

export default withSessionRoute(handler);
