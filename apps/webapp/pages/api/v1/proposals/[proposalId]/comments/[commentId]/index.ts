import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from '@packages/lib/middleware';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';
import { superApiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from '@packages/lib/session/withSession';

import type { PublicApiProposalComment } from '../index';

const handler = superApiHandler();

handler.delete(deleteProposalComment).put(requireKeys(['contentMarkdown'], 'body'), updateProposalComment);

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments/{commentId}:
 *   delete:
 *     summary: Delete a proposal comment
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: params
 *         required: true
 *         type: string
 *         description: ID or page path of the related proposal
 *       - name: commentId
 *         in: params
 *         required: true
 *         type: string
 *         description: ID of the comment to update
 *
 */
async function deleteProposalComment(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment>) {
  // This should never be undefined, but adding this safeguard for future proofing

  const result = await prisma.pageComment.findFirstOrThrow({
    where: {
      id: req.query.commentId as string,
      page: {
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
    await prisma.pageComment.delete({
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
 * /proposals/{proposalIdOrPath}/comments/{commentId}:
 *   put:
 *     summary: Update a proposal comment
 *     description: Update the content of an existing proposal comment
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: params
 *         required: true
 *         type: string
 *         description: ID or page path of the related proposal
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
 *                $ref: '#/components/schemas/ProposalComment'
 *
 */
async function updateProposalComment(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment>) {
  // This should never be undefined, but adding this safeguard for future proofing

  const newCommentText = req.body.contentMarkdown;

  const existingComment = await prisma.pageComment.findFirstOrThrow({
    where: {
      id: req.query.commentId as string,
      page: {
        ...generatePageQuery({
          pageIdOrPath: req.query.proposalId as string
        }),
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

  const commentContent = await parseMarkdown(newCommentText);

  const proposalComment = await prisma.pageComment.update({
    where: {
      id: existingComment.id
    },
    data: {
      contentText: newCommentText,
      content: commentContent
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

  const apiComment: PublicApiProposalComment = {
    id: proposalComment.id,
    createdAt: proposalComment.createdAt.toISOString(),
    content: {
      markdown: newCommentText,
      text: newCommentText
    },
    createdBy: proposalComment.createdBy,
    downvotes: proposalComment.votes.filter((v) => !v.upvoted).length,
    upvotes: proposalComment.votes.filter((v) => v.upvoted).length,
    parentId: proposalComment.parentId,
    children: []
  };

  log.debug('[public-api] Updated comment content', { query: req.query, commentId: proposalComment.id });

  return res.status(200).json(apiComment);
}

export default withSessionRoute(handler);
