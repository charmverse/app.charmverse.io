import type { PageComment, PageCommentVote } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { InvalidStateError } from 'lib/middleware';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiProposal } from '../index';

const handler = apiHandler();

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
 *           type: string
 *           description: User ID of the user who created the comment
 *           example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *         upvotes:
 *           type: integer
 *           example: 5
 *         downvotes:
 *           type: integer
 *           example: 2
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProposalComment'
 *             example:
 *               id: "4ba85f64-5717-4562-b3fc-2c963f66afa7"
 *               parentId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               content:
 *                 text: "This is a child comment."
 *                 markdown: "### This is a child comment."
 *               createdBy: "79a54a56-50d6-4f7b-b350-2d9c312f81f4"
 *               upvotes: 3
 *               downvotes: 1
 *               children: []
 *
 */
export type PublicApiProposalComment = {
  id: string;
  parentId: string | null;
  content: {
    text: string;
    markdown: string;
  };
  createdBy: string;
  upvotes: number;
  downvotes: number;
  children: PublicApiProposalComment[];
};

/**
 * @swagger
 * components:
 *   schemas:
 *     ProposalWithDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/Proposal'
 *         - type: object
 *           properties:
 *             comments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProposalComment'
 */
export type PublicApiProposalWithDetails = PublicApiProposal & {
  comments: PublicApiProposalComment[];
};
async function reducePageComments({
  comments
}: {
  comments: (Pick<PageComment, 'id' | 'parentId' | 'content' | 'contentText' | 'createdBy'> & {
    votes: Pick<PageCommentVote, 'upvoted'>[];
  })[];
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
      ...comment,
      content: {
        markdown: parsedContent,
        text: comment.contentText
      },
      upvotes,
      downvotes,
      children: []
    };

    mappedComments[comment.id] = commentWithDetails;

    if (!commentWithDetails.parentId) {
      rootComments.push(commentWithDetails);
    }
  }

  // Iterate a second time to add children
  for (const comment of Object.values(mappedComments)) {
    if (comment.parentId && mappedComments[comment.parentId]) {
      mappedComments[comment.parentId].children.push();
    }
  }

  return rootComments;
}

handler.get(getProposal);

/**
 * @swagger
 * /proposals/{proposalIdOrPath}:
 *   get:
 *     summary: Get a proposal
 *     description: Return data for a proposal from the API
 *     tags:
 *      - 'Space API'
 *     responses:
 *       200:
 *         description: List of proposals of casted vote
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ProposalWithDetails'
 *
 */
async function getProposal(req: NextApiRequest, res: NextApiResponse<PublicApiProposalWithDetails>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    }
  });

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: space.id
      })
    },
    select: {
      id: true,
      status: true,
      page: {
        select: {
          path: true,
          createdAt: true,
          title: true,
          content: true,
          contentText: true,
          deletedAt: true,
          comments: {
            select: {
              id: true,
              parentId: true,
              content: true,
              contentText: true,
              createdBy: true,
              votes: {
                select: {
                  upvoted: true
                }
              }
            }
          }
        }
      },
      reviewers: {
        include: {
          role: {
            select: {
              id: true
            }
          },
          reviewer: {
            select: {
              id: true
            }
          }
        }
      },
      authors: {
        include: {
          author: {
            select: {
              wallets: true,
              id: true,
              googleAccounts: true
            }
          }
        }
      }
    }
  });

  const markdownText = await generateMarkdown({
    content: proposal.page?.content as any
  });

  const commentTree = await reducePageComments({
    comments: proposal.page?.comments ?? []
  });

  const apiProposal: PublicApiProposalWithDetails = {
    id: proposal.id,
    createdAt: proposal.page?.createdAt as any,
    url: `${process.env.DOMAIN}/${space?.domain}/${proposal.page?.path}`,
    title: proposal.page?.title ?? '',
    content: {
      text: proposal.page?.contentText ?? '',
      markdown: markdownText
    },
    status: proposal.status,
    authors: proposal.authors.map((author) => ({
      userId: author.author?.id,
      address: author.author?.wallets[0]?.address,
      email: author.author?.googleAccounts[0]?.email
    })),
    reviewers: proposal.reviewers.map((reviewer) => ({
      id: reviewer.role?.id ?? (reviewer.reviewer?.id as string),
      type: reviewer.role ? 'role' : 'user'
    })),
    comments: commentTree
  };
  return res.status(200).json({ ...apiProposal, comments: [] });
}

export default withSessionRoute(handler);
