import { getCurrentEvaluation } from '@packages/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';
import fs from 'fs';
import path from 'path';
import { isTruthy } from '@packages/utils/types';
import { getCsvData } from './retroPGF/v4/data';

// Put the appeal-reviewers.json file in the same level as this file
// const proposalConfigs: {
//   // proposal page path
//   path: string;
//   // Reviewer identifiers list
//   reviewers: string[];
// }[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'appeal-reviewers.json'), 'utf-8'));

const appealRows = getCsvData<{
  'Charmverse link': string;
  'Reviewer 1': string;
  'Reviewer 2': string;
  'Reviewer 3': string;
  'Reviewer 4': string;
  'Reviewer 5': string;
}>('../optimism-data/appeals.csv');

export async function updateAppealReviewers() {
  let updatedProposals = 0;
  for (const proposalConfig of appealRows) {
    const path = proposalConfig['Charmverse link'].split('/').pop();
    const reviewerEmails = [
      proposalConfig['Reviewer 1'],
      proposalConfig['Reviewer 2'],
      proposalConfig['Reviewer 3'],
      proposalConfig['Reviewer 4'],
      proposalConfig['Reviewer 5']
    ].map((name) => name.split(' ')[0]);

    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          path
        }
      },
      select: {
        spaceId: true,
        id: true,
        page: {
          select: {
            createdBy: true
          }
        },
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });

    const currentEvaluation = proposal.evaluations.find((evaluation) => evaluation.title === 'Full Review');
    if (!currentEvaluation) {
      throw new Error(`Proposal ${proposal.id} is not appealable`);
    }
    console.log(proposal.page?.createdBy);
    console.log(currentEvaluation);
    // if (!currentEvaluation?.appealedAt) {
    //   throw new Error(`Proposal ${proposal.id} has not been appealed`);
    //}
    const reviewers = (
      await Promise.all(
        reviewerEmails.map((reviewer) =>
          prisma.user.findFirst({
            where: {
              spaceRoles: {
                some: {
                  space: {
                    id: proposal.spaceId
                  }
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
                      ensname: reviewer
                    }
                  }
                },
                {
                  verifiedEmails: {
                    some: {
                      email: reviewer.toLowerCase()
                    }
                  }
                }
              ]
            },
            include: {
              wallets: true,
              verifiedEmails: true
            }
          })
        )
      )
    ).filter(isTruthy);

    if (reviewers.length !== reviewerEmails.length) {
      console.log(JSON.stringify(reviewers, null, 2));
      console.log(reviewerEmails);
      throw new Error(`Could not find all reviewers for proposal ${proposal.id}`);
    }

    // await prisma.$transaction([
    //   prisma.proposalAppealReviewer.deleteMany({
    //     where: {
    //       proposalId: proposal.id,
    //       evaluationId: currentEvaluation.id
    //     }
    //   }),
    //   prisma.proposalAppealReviewer.createMany({
    //     data: reviewers.map((reviewer) => ({
    //       evaluationId: currentEvaluation.id,
    //       userId: reviewer.id,
    //       proposalId: proposal.id
    //     }))
    //   })
    // ]);
    updatedProposals++;
    console.log(`Updated ${updatedProposals}/${appealRows.length} proposal appeal reviewers`);
  }
}

async function markAppealed() {
  const appealReason = '';

  await prisma.proposalEvaluation.update({
    where: {
      id: '974710bf-d53d-45c1-8732-9a0bcf3f64ef'
    },
    data: {
      appealedAt: new Date(),
      result: null,
      appealedBy: '1e530166-2a3e-4aee-9d86-cfa199784d28',
      appealReason,
      completedAt: null
    }
  });
}
// markAppealed();

updateAppealReviewers();
