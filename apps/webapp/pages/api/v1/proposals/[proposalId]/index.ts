import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { apiHandler } from 'lib/public-api/handler';

import type { PublicApiProposal } from '../index';

const handler = apiHandler();

handler.get(getProposal);

/**
 * @swagger
 * /proposals/{proposalIdOrPath}:
 *   get:
 *     summary: Get a proposal
 *     description: Return data for a proposal from the API
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         description: The ID or page link of ie. "page-123344453" of the proposal to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proposal data and page content
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Proposal'
 *
 */
async function getProposal(req: NextApiRequest, res: NextApiResponse<PublicApiProposal>) {
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
          votes: {
            where: {
              context: 'proposal'
            },
            select: {
              voteOptions: true
            }
          },
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
              googleAccounts: true,
              verifiedEmails: true
            }
          }
        }
      },
      evaluations: true
    }
  });

  const markdownText = await generateMarkdown({
    content: proposal.page?.content as any
  });
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const previousEvaluation =
    currentEvaluation && currentEvaluation.index > 0 ? proposal.evaluations[currentEvaluation.index - 1] : null;
  const isActiveVote = currentEvaluation?.result === null && currentEvaluation?.type === 'vote';
  const apiProposal: PublicApiProposal = {
    id: proposal.id,
    createdAt: proposal.page?.createdAt as any,
    url: `${process.env.DOMAIN}/${space?.domain}/${proposal.page?.path}`,
    title: proposal.page?.title ?? '',
    content: {
      text: proposal.page?.contentText ?? '',
      markdown: markdownText
    },
    currentStep: currentEvaluation
      ? {
          type: currentEvaluation.type,
          result: currentEvaluation.result || 'in_progress',
          startedAt: (previousEvaluation?.completedAt || proposal.page?.createdAt || new Date()).toISOString(),
          title: currentEvaluation.title,
          completedAt: currentEvaluation.completedAt?.toISOString()
        }
      : {
          startedAt: (proposal.page?.createdAt || new Date()).toISOString(),
          result: 'in_progress',
          title: 'Draft',
          type: 'draft'
        },
    status: isActiveVote ? 'vote_active' : proposal.status,
    authors: proposal.authors.map((author) => ({
      userId: author.author?.id,
      address: author.author?.wallets[0]?.address,
      email: author.author?.googleAccounts[0]?.email ?? author.author?.verifiedEmails[0]?.email
    })),
    reviewers: proposal.reviewers.map((reviewer) => ({
      id: reviewer.role?.id ?? (reviewer.reviewer?.id as string),
      type: reviewer.role ? 'role' : 'user'
    })),
    voteOptions: proposal.page?.votes[0]?.voteOptions.map((opt) => opt.name)
  };

  return res.status(200).json(apiProposal);
}

export default withSessionRoute(handler);
