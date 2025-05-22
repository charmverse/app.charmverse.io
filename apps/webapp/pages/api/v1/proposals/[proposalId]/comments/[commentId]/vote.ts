import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { MixpanelEventName } from '@packages/metrics/mixpanel/interfaces';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { superApiHandler } from 'lib/public-api/handler';

import type { PublicApiProposalComment } from '../index';

const handler = superApiHandler();

handler.post(requireKeys(['userId'], 'body'), voteComment);

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments/{commentId}/vote:
 *   post:
 *     summary: Up/downvote a proposal comment
 *     description: Adds a vote for a proposal comment by a specific user
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         type: string
 *         description: ID or page path of the related proposal
 *       - name: commentId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the comment to create a vote for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of the user who is performing the upvote / downvote
 *                 example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *               upvoted:
 *                 type: boolean
 *                 nullable: true
 *                 description: true for an upvote, false for a downvote, null to delete the user's upvote / downvote
 *                 example: true
 *             required:
 *               - userId
 *               - upvoted
 *     responses:
 *       200:
 *         description: Comment where the vote was made with refreshed vote count
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ProposalComment'
 *
 */
async function voteComment(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const userId = req.body.userId as string;
  const commentId = req.query.commentId as string;

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string
      }),
      spaceId: {
        in: req.spaceIdRange
      }
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (req.body.upvoted === null) {
    await prisma.pageCommentVote.delete({
      where: {
        createdBy_commentId: {
          commentId,
          createdBy: userId
        }
      }
    });
  } else {
    await prisma.pageCommentVote.upsert({
      where: {
        createdBy_commentId: {
          commentId,
          createdBy: userId
        }
      },
      create: {
        createdBy: userId,
        upvoted: req.body.upvoted,
        comment: { connect: { id: commentId } }
      },
      update: {
        upvoted: req.body.upvoted
      }
    });
    const userAction: MixpanelEventName = req.body.upvoted ? 'upvote_proposal_comment' : 'downvote_proposal_comment';
    trackUserAction(userAction, {
      resourceId: proposal.id,
      spaceId: proposal.spaceId,
      userId
    });
  }

  const proposalComment = await prisma.pageComment.findUniqueOrThrow({
    where: {
      id: commentId
    },
    select: {
      parentId: true,
      createdAt: true,
      content: true,
      votes: {
        select: {
          upvoted: true
        }
      }
    }
  });

  const commentContent = await generateMarkdown({ content: proposalComment.content });

  const apiComment: PublicApiProposalComment = {
    id: commentId,
    createdAt: proposalComment.createdAt.toISOString(),
    content: {
      markdown: commentContent,
      text: commentContent
    },
    createdBy: userId,
    downvotes: proposalComment.votes.filter((v) => !v.upvoted).length,
    upvotes: proposalComment.votes.filter((v) => v.upvoted).length,
    parentId: proposalComment.parentId,
    children: []
  };

  return res.status(200).json(apiComment);
}

export default withSessionRoute(handler);
