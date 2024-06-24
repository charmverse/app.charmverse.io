
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';
import fs from 'fs';
import path from 'path';
import { isTruthy } from 'lib/utils/types';

// Put the appeal-reviewers.json file in the same level as this file
const proposalConfigs: {
  // proposal page path
  path: string
  // Reviewer identifiers list
  reviewers: string[]
}[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'appeal-reviewers.json'), 'utf-8'))

export async function updateAppealReviewers() {
  const totalProposals = proposalConfigs.length;
  let updatedProposals = 0;
  for (const proposalConfig of proposalConfigs) {
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          path: proposalConfig.path
        }
      },
      select: {
        spaceId: true,
        id: true,
        evaluations: {
          orderBy: {
            index: "asc"
          }
        }
      }
    });

    const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
    if (currentEvaluation?.title !== "Full Review") {
      throw new Error(`Proposal ${proposal.id} does not have a Full Review evaluation`);
    }
    if (!currentEvaluation?.appealable) {
      throw new Error(`Proposal ${proposal.id} is not appealable`);
    }
    if (!currentEvaluation?.appealedAt) {
      throw new Error(`Proposal ${proposal.id} has not been appealed`);
    }
    const reviewers = (await Promise.all(proposalConfig.reviewers.map(reviewer => prisma.user.findFirst({
      where: {
        spaceRoles: {
          some: {
            space: {
              id: proposal.spaceId
            },
          }
        },
        OR: [
          {
            username: reviewer
          },
          {
            wallets: {
              some: {
                address: reviewer.toLowerCase()
              }
            }
          },
          {
            wallets: {
              some: {
                ensname: reviewer.toLowerCase()
              }
            }
          },
          {
            verifiedEmails: {
              some: {
                email: reviewer
              }
            }
          },
        ]
      }
    })))).filter(isTruthy);

    if (reviewers.length !== proposalConfig.reviewers.length) {
      throw new Error(`Could not find all reviewers for proposal ${proposal.id}`);
    }

    await prisma.$transaction([
      prisma.proposalAppealReviewer.deleteMany({
        where: {
          proposalId: proposal.id,
          evaluationId: currentEvaluation.id
        }
      }),
      prisma.proposalAppealReviewer.createMany({
        data: reviewers.map(reviewer => ({
          evaluationId: currentEvaluation.id,
          userId: reviewer.id,
          proposalId: proposal.id,
        }))
      })
    ])
    updatedProposals++;
    console.log(`Updated ${updatedProposals}/${totalProposals} proposal appeal reviewers`);
  }
}

updateAppealReviewers();