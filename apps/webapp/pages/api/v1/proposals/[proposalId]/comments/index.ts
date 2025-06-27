import type { PageComment, PageCommentVote } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { parseMarkdown } from '@packages/bangleeditor/markdown/parseMarkdown';
import { InvalidInputError } from '@packages/core/errors';
import { requireApiKey, requireKeys, requireSuperApiKey } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { defaultHandler, logApiRequest } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import type { UserInfo } from 'lib/public-api/searchUserProfile';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';

const handler = defaultHandler();

handler.get(requireApiKey, logApiRequest, getProposalComments);

handler.post(
  requireSuperApiKey,
  logApiRequest,
  requireKeys(['userId', 'contentMarkdown'], 'body'),
  createProposalComment
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ProposalComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent comment
 *           example: null
 *         content:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               example: "This is a comment."
 *             markdown:
 *               type: string
 *               example: "## This is a comment."
 *         createdBy:
 *           oneOf:
 *             - type: string
 *               description: User ID of the user who created the comment
 *               example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *             - $ref: '#/components/schemas/SearchUserResponseBody'
 *         createdAt:
 *           type: string
 *           description: ISO Timestamp of comment creation date
 *           example: '2023-09-20T01:37:24.262Z'
 *         upvotes:
 *           type: integer
 *           example: 5
 *         downvotes:
 *           type: integer
 *           example: 2
 *         children:
 *           type: array
 *           description: Child comments of this comment. By default, this array is empty unless you request comments as a tree
 *           example: []
 */
export type PublicApiProposalComment = {
  id: string;
  createdBy: string | UserProfile;
  createdAt: string;
  parentId: string | null;
  content: {
    text: string;
    markdown: string;
  };
  upvotes: number;
  downvotes: number;
  children: PublicApiProposalComment[];
};

async function mapReducePageComments({
  comments,
  reduceToTree
}: {
  comments: (Pick<PageComment, 'id' | 'parentId' | 'content' | 'contentText' | 'createdAt'> & {
    votes: Pick<PageCommentVote, 'upvoted'>[];
    createdBy: string | UserProfile;
  })[];
  reduceToTree?: boolean;
}): Promise<PublicApiProposalComment[]> {
  const mappedComments: Record<string, PublicApiProposalComment> = {};

  const rootComments: PublicApiProposalComment[] = [];

  // Map comments to correct shape
  for (const comment of comments) {
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

    const parsedContent = await generateMarkdown({
      content: comment.content
    });

    const commentWithDetails: PublicApiProposalComment = {
      id: comment.id,
      createdBy: comment.createdBy,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      content: {
        markdown: parsedContent,
        text: comment.contentText
      },
      upvotes,
      downvotes,
      children: []
    };

    // Remove unneeded votes

    mappedComments[comment.id] = commentWithDetails;

    if (!commentWithDetails.parentId) {
      rootComments.push(commentWithDetails);
    }
  }

  const allComments = Object.values(mappedComments);

  // Early exit with default behaviour
  if (!reduceToTree) {
    return allComments;
  }

  // Iterate a second time to add children
  for (const comment of allComments) {
    if (comment.parentId && mappedComments[comment.parentId]) {
      mappedComments[comment.parentId].children.push(comment);
    }
  }

  return rootComments;
}

const expandableFields = ['user'];

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments:
 *   get:
 *     summary: Get proposal comments
 *     description: Return comments for a proposal as an array (default) or a tree
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID or path of the database to create a card in
 *       - name: resultsAsTree
 *         in: query
 *         required: false
 *         description: Optional parameter to get the comments as a tree structure
 *         schema:
 *           type: boolean
 *       - name: expand
 *         in: query
 *         required: false
 *         description: An array of additional fields to expand
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user]
 *     responses:
 *       200:
 *         description: List of proposal comments
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/ProposalComment'
 *
 */
async function getProposalComments(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment[]>) {
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

  // If a single key=value pair is passed its converted into a string
  const expand = Array.isArray(req.query.expand)
    ? req.query.expand
    : typeof req.query.expand === 'string'
      ? [req.query.expand]
      : [];

  const hasUnsupportedExpandableFields = expand.some((expandField) => !expandableFields.includes(expandField));

  if (hasUnsupportedExpandableFields) {
    throw new InvalidInputError(
      `Unsupported expand field: ${expand}. Please provide one of ${expandableFields.join(',')}`
    );
  }

  const proposalComments = await prisma.pageComment.findMany({
    where: {
      pageId: proposal.id
    },
    select: {
      id: true,
      parentId: true,
      content: true,
      contentText: true,
      createdBy: true,
      createdAt: true,
      votes: {
        select: {
          upvoted: true
        }
      },
      ...(expand.includes('user')
        ? {
            user: {
              select: userProfileSelect
            }
          }
        : {})
    }
  });

  const mappedComments = await mapReducePageComments({
    comments: proposalComments.map((proposalComment) => {
      return {
        ...proposalComment,
        createdBy: proposalComment.user
          ? getUserProfile(proposalComment.user as unknown as UserInfo)
          : proposalComment.createdBy
      };
    }),
    reduceToTree: req.query.resultsAsTree === 'true'
  });

  return res.status(200).json(mappedComments);
}

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/comments:
 *   post:
 *     summary: Create proposal comment
 *     description: Adds a new top-level comment to a proposal, or a response to an existing proposal comment
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the related proposal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of comment author
 *                 example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *               contentMarkdown:
 *                 type: string
 *                 description: Content of the comment as a string or markdown
 *                 example: "This is a comment."
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 description: ID of the parent comment, if this is a response to an existing comment
 *                 example: "36d31192-af56-4e74-9f85-502a21032b51"
 *
 *             required:
 *               - userId
 *               - content
 *     responses:
 *       200:
 *         description: Created comment
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ProposalComment'
 *
 */
async function createProposalComment(req: NextApiRequest, res: NextApiResponse<PublicApiProposalComment>) {
  // This should never be undefined, but adding this safeguard for future proofing
  if (!req.spaceIdRange) {
    throw new InvalidStateError('Space ID is undefined');
  }

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

  const userId = req.body.userId as string;

  const commentContent = await parseMarkdown(req.body.contentMarkdown);

  const proposalComment = await prisma.pageComment.create({
    data: {
      page: { connect: { id: proposal.id } },
      parentId: req.body.parentId,
      contentText: req.body.contentMarkdown,
      user: { connect: { id: userId } },
      content: commentContent
    }
  });

  trackUserAction('create_proposal_comment', {
    resourceId: proposal.id,
    spaceId: proposal.spaceId,
    userId
  });

  const apiComment: PublicApiProposalComment = {
    id: proposalComment.id,
    createdAt: proposalComment.createdAt.toISOString(),
    content: {
      markdown: req.body.contentMarkdown,
      text: req.body.contentMarkdown
    },
    createdBy: userId,
    downvotes: 0,
    upvotes: 0,
    parentId: proposalComment.parentId,
    children: []
  };

  return res.status(201).json(apiComment);
}

export default withSessionRoute(handler);
