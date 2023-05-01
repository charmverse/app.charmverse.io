import { prisma } from '@charmverse/core';
import type { ProposalStatus } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

import { InvalidStateError } from 'lib/middleware';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

const handler = apiHandler();

type ProposalAuthor = {
  userId: string;
  address?: string;
  email?: string;
};

type ProposalReviewer = {
  type: 'role' | 'user';
  id: string;
};
/**
 * @swagger
 * components:
 *  schemas:
 *    ProposalAuthor:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        address:
 *          type: string
 *          example: 0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE
 *        email:
 *          type: string
 *          example: jane.doe@acme.corp
 *    ProposalReviewer:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        type:
 *          type: string
 *          example: user
 *          enum:
 *            - user
 *            - role
 *        email:
 *          type: string
 *          example: jane.doe@acme.corp
 *    Proposal:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        content:
 *          type: object
 *          properties:
 *            text:
 *              type: string
 *            markdown:
 *              type: string
 *        authors:
 *          type: array
 *          $ref: '#/components/schemas/ProposalAuthor'
 *        reviewers:
 *          type: array
 *          $ref: '#/components/schemas/ProposalReviewer'
 *        status:
 *          type: string
 *          example: vote_active
 *          enum:
 *            - discussion
 *            - review
 *            - reviewed
 *            - vote_active
 *            - vote_closed
 *        title:
 *          type: string
 *          example: EIP-4361 Sign in with Ethereum
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/charmverse/proposals?id=3334afc4-5f0a-4d3c-8889-56fcc2b2ed8d
 *
 */
export interface PublicApiProposal {
  id: string;
  createdAt: string;
  content: {
    text: string;
    markdown: string;
  };
  authors: ProposalAuthor[];
  reviewers: ProposalReviewer[];
  status: ProposalStatus;
  title: string;
  url: string;
}

handler.get(listProposals);

/**
 * @swagger
 * /proposals:
 *   get:
 *     summary: Get active proposals.
 *     description: Get a list of all proposals that are currently active in the space.
 *     responses:
 *       200:
 *         description: List of proposals of casted vote
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  $ref: '#/components/schemas/Proposal'
 */
async function listProposals(req: NextApiRequest, res: NextApiResponse<PublicApiProposal[]>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  const proposals = await prisma.proposal
    .findMany({
      where: {
        spaceId: req.authorizedSpaceId,
        status: {
          not: 'draft'
        }
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
            deletedAt: true
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
    })
    // Make the API response faster by avoiding a join operation on the database, and filtering the results
    .then((_proposalList) => _proposalList.filter((p) => !p.page?.deletedAt));

  const markdownTexts: string[] = [];

  for (const proposal of proposals) {
    try {
      const markdownText = await generateMarkdown({
        content: proposal.page?.content as any
      });
      markdownTexts.push(markdownText);
    } catch (err) {
      markdownTexts.push('markdown not available');
    }
  }

  const publicApiProposalList: PublicApiProposal[] = proposals.map((proposal, index) => {
    const apiProposal: PublicApiProposal = {
      id: proposal.id,
      createdAt: proposal.page?.createdAt as any,
      url: `${process.env.DOMAIN}/${space?.domain}/${proposal.page?.path}`,
      title: proposal.page?.title ?? '',
      content: {
        text: proposal.page?.contentText ?? '',
        markdown: markdownTexts[index]
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
      }))
    };
    return apiProposal;
  });
  return res.status(200).json(publicApiProposalList);
}

export default withSessionRoute(handler);
