import { Proposal } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

// This script is a work in progress
// It adds proposal steps to existing proposals

async function convertProposals() {
  const proposals = await prisma.proposal.findMany({
    include: {
      evaluations: true,
      page: {
        select: {
          snapshotProposalId: true,
          votes: true
        }
      }
    }
  });
  const proposalsToUpdate = proposals.filter((p) => p.evaluations.length === 0);
  await Promise.all(
    proposalsToUpdate.map(async (p) => {
      if (p.evaluationType === 'vote') {
        const vote = p.page?.votes.find((v) => v.context === 'proposal');
        const votePassed = vote?.status === 'Passed';
        const completedAt = vote?.deadline;
        const voteFailed = vote?.status === 'Rejected';
        const result = votePassed ? 'pass' : voteFailed ? 'fail' : null;
        await prisma.$transaction(async (tx) => {
          if (isPublished(p)) {
            await tx.proposal.update({
              where: {
                id: p.id
              },
              data: {
                status: 'published'
              }
            });
          }
          await tx.proposalEvaluation.create({
            data: {
              id: uuid(),
              title: 'Vote',
              index: 0,
              type: 'vote',
              result,
              completedAt: result ? completedAt || new Date() : null,
              proposalId: p.id,
              snapshotId: p.page?.snapshotProposalId,
              voteId: vote?.id,
              reviewers: {
                create: {
                  proposalId: p.id
                }
              }
            }
          });
        });
      } else if (p.evaluationType === 'rubric') {
        const evaluationId = uuid();
        await prisma.$transaction(async (tx) => {
          if (isPublished(p)) {
            await tx.proposal.update({
              where: {
                id: p.id
              },
              data: {
                status: 'published'
              }
            });
          }
          await tx.proposalEvaluation.create({
            data: {
              id: evaluationId,
              title: 'Rubric evaluation',
              index: 0,
              type: 'rubric',
              proposalId: p.id
            }
          });
          await tx.proposalReviewer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId
            }
          });
          await tx.proposalRubricCriteria.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId
            }
          });
          await tx.proposalRubricCriteriaAnswer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId
            }
          });
          await tx.draftProposalRubricCriteriaAnswer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId
            }
          });
        });
      }
    })
  );
}

function isPublished(proposal: Proposal) {
  return proposal.status !== 'draft' && proposal.status !== 'discussion';
}
