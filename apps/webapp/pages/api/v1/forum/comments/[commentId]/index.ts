import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { deletePostComment } from '@packages/lib/forums/comments/deletePostComment';
import { requireKeys } from '@packages/lib/middleware';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';
import { superApiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from '@packages/lib/session/withSession';

import type { PublicApiPostComment } from '../../posts/[postId]/comments';

const handler = superApiHandler()
  .delete(deletePostCommentEndpoint)
  .put(requireKeys(['contentMarkdown'], 'body'), updatePostCommentEndpoint);

/**
 * @swagger
 * /forum/comments/{commentId}:
 *   put:
 *     summary: Update a post comment
 *     description: Update the content of an existing post comment
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
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of the user who is creating the comment
 *                 example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *               contentMarkdown:
 *                 type: string
 *                 description: Content of the comment
 *                 example: "This is a comment."
 *             required:
 *               - userId
 *               - content
 *     responses:
 *       200:
 *         description: Updated comment
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPostComment'
 *
 */

async function updatePostCommentEndpoint(req: NextApiRequest, res: NextApiResponse<PublicApiPostComment>) {
  const commentId = req.query.commentId;
  // This should never be undefined, but adding this safeguard for future proofing
  if (typeof commentId !== 'string') {
    throw new InvalidInputError('Comment Id is undefined');
  }

  const newCommentText = req.body.contentMarkdown;

  const existingComment = await prisma.postComment.findFirstOrThrow({
    where: {
      id: req.query.commentId as string,
      post: {
        spaceId: req.authorizedSpaceId
          ? req.authorizedSpaceId
          : {
              in: req.spaceIdRange
            }
      }
    },
    select: {
      id: true
    }
  });

  const commentContent = parseMarkdown(newCommentText);

  const postComment = await prisma.postComment.update({
    where: {
      id: existingComment.id
    },
    data: {
      contentText: newCommentText,
      content: commentContent,
      updatedAt: new Date()
    },
    select: {
      id: true,
      createdAt: true,
      parentId: true,
      votes: {
        select: {
          upvoted: true
        }
      },
      user: { select: userProfileSelect }
    }
  });

  const apiComment: PublicApiPostComment = {
    id: postComment.id,
    createdAt: postComment.createdAt.toISOString(),
    content: {
      markdown: newCommentText,
      text: newCommentText
    },
    author: getUserProfile(postComment.user),
    downvotes: postComment.votes.filter((v) => !v.upvoted).length,
    upvotes: postComment.votes.filter((v) => v.upvoted).length,
    parentId: postComment.parentId,
    children: []
  };

  log.debug('[public-api] Updated comment content', { query: req.query, commentId: postComment.id });

  return res.status(200).json(apiComment);
}

/**
 * @swagger
 * /forum/comments/{commentId}:
 *   delete:
 *     summary: Delete a post comment
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: commentId
 *         in: params
 *         required: true
 *         type: string
 *         description: ID of the comment to delete
 *
 */
async function deletePostCommentEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const commentId = req.query.commentId;
  // This should never be undefined, but adding this safeguard for future proofing
  if (typeof commentId !== 'string') {
    throw new InvalidInputError('Comment Id is undefined');
  }

  const result = await prisma.postComment.findFirstOrThrow({
    where: {
      id: req.query.commentId as string,
      post: {
        spaceId: req.authorizedSpaceId
          ? req.authorizedSpaceId
          : {
              in: req.spaceIdRange
            }
      }
    },
    select: {
      id: true,
      createdBy: true
    }
  });

  await deletePostComment({ commentId: result.id, userId: result.createdBy });

  log.debug('[public-api] Deleted comment', { query: req.query, result });

  return res.status(200).end();
}

export default withSessionRoute(handler);
