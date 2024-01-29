import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown';
import { superApiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiPostComment } from '../../posts/[postId]/comments';

const handler = superApiHandler();

handler.delete(deletePostComment).put(requireKeys(['contentMarkdown'], 'body'), updatePostComment);

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
 *         description: ID of the comment to update
 *
 */
async function deletePostComment(req: NextApiRequest, res: NextApiResponse) {
  // This should never be undefined, but adding this safeguard for future proofing

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
      id: true
    }
  });

  if (result) {
    await prisma.postComment.delete({
      where: {
        id: result.id
      }
    });
  }

  log.debug('[public-api] Deleted comment', { query: req.query, result });

  return res.status(200).end();
}

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
async function updatePostComment(req: NextApiRequest, res: NextApiResponse<PublicApiPostComment>) {
  // This should never be undefined, but adding this safeguard for future proofing

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
      createdBy: true
    }
  });

  const apiComment: PublicApiPostComment = {
    id: postComment.id,
    createdAt: postComment.createdAt.toISOString(),
    content: {
      markdown: newCommentText,
      text: newCommentText
    },
    createdBy: postComment.createdBy,
    downvotes: postComment.votes.filter((v) => !v.upvoted).length,
    upvotes: postComment.votes.filter((v) => v.upvoted).length,
    parentId: postComment.parentId,
    children: []
  };

  log.debug('[public-api] Updated comment content', { query: req.query, commentId: postComment.id });

  return res.status(200).json(apiComment);
}

export default withSessionRoute(handler);
