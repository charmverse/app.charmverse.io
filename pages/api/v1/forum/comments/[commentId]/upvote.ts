import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { superApiHandler } from 'lib/public-api/handler';
import { userProfileSelect, getUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiPostComment } from '../../posts/[postId]/comments/index';

const handler = superApiHandler();

handler.post(requireKeys(['userId', 'upvoted'], 'body'), upvoteOnComment);

/**
 * @swagger
 * /forum/comments/{commentId}/vote:
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

  if (req.body.upvoted === null) {
    await prisma.postCommentUpDownVote.delete({
      where: {
        createdBy_commentId: {
          commentId,
          createdBy: userId
        }
      }
    });
  } else {
    await prisma.postCommentUpDownVote.upsert({
      where: {
        createdBy_commentId: {
          commentId,
          createdBy: userId
        }
      },
      create: {
        createdBy: userId,
        upvoted: req.body.upvoted,
        comment: { connect: { id: commentId } },
        post: { connect: { id: postId } }
      },
      update: {
        upvoted: req.body.upvoted
      }
    });
  }

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
