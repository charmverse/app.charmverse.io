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
      reviewers: true,
      space: {
        include: {
          proposalWorkflows: true
        }
      }
    }
  });
  const proposalsToUpdate = proposals.filter((p) => p.evaluations.length === 0);
  console.log('proposals to update', proposalsToUpdate.length);
  await Promise.all(
    proposalsToUpdate.map(async (p) => {
      if (p.evaluationType === 'vote') {
        const workflow = p.space.proposalWorkflows.find((w) => w.title === 'Community Proposals');
        const vote = p.page?.votes.find((v) => v.context === 'proposal');
        const votePassed = vote?.status === 'Passed';
        const completedAt = vote?.deadline;
        const voteFailed = vote?.status === 'Rejected';
        const result = votePassed ? 'pass' : voteFailed ? 'fail' : null;
        const reviewEvaluationId = uuid();
        await prisma.$transaction(async (tx) => {
          await tx.proposal.update({
            where: {
              id: p.id
            },
            data: {
              status: isPublished(p) ? 'published' : undefined,
              workflowId: workflow?.id
            }
          });
          const feedbackComplete = p.status !== 'draft' && p.status !== 'discussion';
          await tx.proposalEvaluation.create({
            data: {
              ...feedbackEvaluation,
              index: 0,
              result: feedbackComplete ? 'pass' : null,
              proposalId: p.id,
              permissions: {
                createMany: {
                  data: feedbackPermissions
                }
              }
            }
          });
          await tx.proposalEvaluation.create({
            data: {
              id: reviewEvaluationId,
              title: 'Review',
              index: 1,
              result: p.reviewedAt ? 'pass' : null,
              completedAt: p.reviewedAt || null,
              decidedBy: p.reviewedBy,
              type: 'pass_fail',
              proposalId: p.id,
              permissions: {
                createMany: {
                  data: getDefaultPermissions()
                }
              }
            }
          });
          await tx.proposalReviewer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId: reviewEvaluationId
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
              snapshotExpiry: p.snapshotProposalExpiry,
              voteId: vote?.id,
              reviewers: p.category
                ? {
                    createMany: {
                      data: p.category.proposalCategoryPermissions
                        .filter((perm) => perm.permissionLevel === 'full_access')
                        .map((perm) => ({
                          proposalId: p.id,
                          roleId: perm.roleId,
                          systemRole: perm.spaceId ? 'space_member' : undefined
                        }))
                    }
                  }
                : undefined,
              permissions: {
                createMany: {
                  data: getDefaultPermissions()
                }
              }
            }
          });
        });
      } else if (p.evaluationType === 'rubric') {
        const reviewEvaluationId = uuid();
        const rubricEvaluationId = uuid();
        await prisma.$transaction(async (tx) => {
          const workflow = p.space.proposalWorkflows.find((w) => w.title === 'Decision Matrix');
          await tx.proposal.update({
            where: {
              id: p.id
            },
            data: {
              status: isPublished(p) ? 'published' : undefined,
              workflowId: workflow?.id
            }
          });
          const feedbackComplete = p.status !== 'draft' && p.status !== 'discussion';
          await tx.proposalEvaluation.create({
            data: {
              ...feedbackEvaluation,
              index: 0,
              result: feedbackComplete ? 'pass' : null,
              proposalId: p.id,
              permissions: {
                createMany: {
                  data: feedbackPermissions
                }
              }
            }
          });
          await tx.proposalEvaluation.create({
            data: {
              id: reviewEvaluationId,
              title: 'Review',
              index: 1,
              result: p.reviewedAt ? 'pass' : null,
              completedAt: p.reviewedAt,
              decidedBy: p.reviewedBy,
              type: 'pass_fail',
              proposalId: p.id,
              permissions: {
                createMany: {
                  data: getDefaultPermissions()
                }
              }
            }
          });
          await tx.proposalEvaluation.create({
            data: {
              id: rubricEvaluationId,
              title: 'Rubric evaluation',
              index: 2,
              type: 'rubric',
              proposalId: p.id,
              permissions: {
                createMany: {
                  data: getDefaultPermissions()
                }
              }
            }
          });
          await tx.proposalReviewer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId: rubricEvaluationId
            }
          });
          await tx.proposalReviewer.createMany({
            data: p.reviewers.map(({ evaluationId, id, ...reviewer }) => ({
              ...reviewer,
              evaluationId: reviewEvaluationId
            }))
          });
          await tx.proposalRubricCriteria.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId: rubricEvaluationId
            }
          });
          await tx.proposalRubricCriteriaAnswer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId: rubricEvaluationId
            }
          });
          await tx.draftProposalRubricCriteriaAnswer.updateMany({
            where: {
              proposalId: p.id
            },
            data: {
              evaluationId: rubricEvaluationId
            }
          });
        });
      }
    })
  );
}
const perBatch = 100;
async function createWorkflows({ offset = 0 }: { offset?: number } = {}) {
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
    return createWorkflows({ offset: offset + perBatch });
  }
}

function isPublished(proposal: Proposal) {
  return proposal.status !== 'draft';
}

createWorkflows()
  .then(() => {
    console.log('Done!');
  })
  .catch((e) => {
    console.error('Error!', e);
  });
