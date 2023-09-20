import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { InvalidStateError, onError, onNoMatch, requireApiKey, requireKeys, requireSuperApiKey } from 'lib/middleware';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown';
import { apiHandler, logApiRequest } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiProposalComment } from '../index';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(requireApiKey, logApiRequest, requireKeys(['userId', 'content'], 'body'), updateProposalComment);

handler.post(requireSuperApiKey, logApiRequest, requireKeys(['userId', 'content'], 'body'), updateProposalComment);

handler.put(requireKeys(['userId', 'content'], 'body'), updateProposalComment);

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments/{commentId}:
 *   put:
 *     summary: Update a proposal comment
 *     description: Update the content of an existing proposal comment
 *     tags:
 *      - 'Space API'
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
 *               content:
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
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: spaceId
      })
    },
    select: {
      id: true
    }
  });

  const commentId = req.query.commentId as string;

  const commentContent = await parseMarkdown(req.body.content);

  const proposalComment = await prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      contentText: req.body.content,
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
    content: req.body.content,
    createdBy: proposalComment.createdBy,
    downvotes: proposalComment.votes.filter((v) => !v.upvoted).length,
    upvotes: proposalComment.votes.filter((v) => v.upvoted).length,
    parentId: proposalComment.parentId,
    children: []
  };

  return res.status(200).json(apiComment);
}

export default withSessionRoute(handler);
