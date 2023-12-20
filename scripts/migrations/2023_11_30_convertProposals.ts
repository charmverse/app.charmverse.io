import { Proposal } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getDefaultWorkflows } from 'lib/proposal/workflows/defaultWorkflows';
import { v4 as uuid } from 'uuid';

import { getDefaultFeedbackEvaluation, getDefaultPermissions } from 'lib/proposal/workflows/defaultEvaluation';
// This script is a work in progress
// It adds proposal steps to existing proposals

const { permissions: feedbackPermissions, id, ...feedbackEvaluation } = getDefaultFeedbackEvaluation();

async function convertProposals() {
  const proposals = await prisma.proposal.findMany({
    include: {
      evaluations: true,
      page: {
        select: {
          snapshotProposalId: true,
          votes: true
        }
      },
      category: {
        include: {
          proposalCategoryPermissions: true
        }
      },
      reviewers: true
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
              ...feedbackEvaluation,
              index: 0,
              proposalId: p.id,
              permissions: {
                create: feedbackPermissions
              }
            }
          });
          await tx.proposalEvaluation.create({
            data: {
              id: uuid(),
              title: 'Vote',
              index: 1,
              type: 'vote',
              result,
              completedAt: result ? completedAt || new Date() : null,
              proposalId: p.id,
              snapshotId: p.page?.snapshotProposalId,
              voteId: vote?.id,
              reviewers: {
                create: p.category?.proposalCategoryPermissions
                  .filter((perm) => perm.permissionLevel === 'full_access')
                  .map((perm) => ({
                    proposalId: p.id,
                    roleId: perm.roleId,
                    systemRole: perm.spaceId ? 'space_member' : undefined
                  }))
              },
              permissions: {
                create: getDefaultPermissions()
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
              ...feedbackEvaluation,
              index: 0,
              proposalId: p.id,
              permissions: {
                create: feedbackPermissions
              }
            }
          });
          await tx.proposalEvaluation.create({
            data: {
              id: evaluationId,
              title: 'Rubric evaluation',
              index: 1,
              type: 'rubric',
              proposalId: p.id,
              permissions: {
                create: getDefaultPermissions()
              }
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
const perBatch = 100;
async function convertSpaces({ offset = 0 }: { offset?: number } = {}) {
  const spaces = await prisma.space.findMany({
    include: {
      proposalWorkflows: true
    },
    orderBy: {
      id: 'asc'
    },
    skip: offset,
    take: perBatch
  });
  const withoutWorkflows = spaces.filter((s) => s.proposalWorkflows.length === 0);
  if (withoutWorkflows.length > 0) {
    console.log('adding workflows for', withoutWorkflows.length, 'spaces');
    await Promise.all(
      withoutWorkflows.map(async (space) => {
        const defaultWorkflows = getDefaultWorkflows(space.id);
        await prisma.proposalWorkflow.createMany({
          data: defaultWorkflows
        });
      })
    );
  }

  if (spaces.length > 0) {
    console.log('checking', offset + perBatch, 'spaces. last id: ' + spaces[spaces.length - 1]?.id);
    return convertSpaces({ offset: offset + perBatch });
  }
}

function isPublished(proposal: Proposal) {
  return proposal.status !== 'draft';
}

convertSpaces()
  .then((r) => {
    console.log('Done!');
  })
  .catch((e) => {
    console.error('error', e);
    process.exit(1);
  });
