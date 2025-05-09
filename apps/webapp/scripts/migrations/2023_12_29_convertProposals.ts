// @ts-nocheck
import { Proposal } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getDefaultWorkflows } from '@packages/lib/proposals/workflows/defaultWorkflows';
import { v4 as uuid } from 'uuid';

import type { ProposalEvaluationInput } from '@packages/lib/proposals/createProposal';
import {
  getDefaultFeedbackEvaluation,
  getDefaultPermissions
} from '@packages/lib/proposals/workflows/defaultEvaluation';
// This script is a work in progress
// It adds proposal steps to existing proposals

const { permissions: feedbackPermissions, id, ...feedbackEvaluation } = getDefaultFeedbackEvaluation();

const perBatch = 50;
async function convertProposals({ offset = 0 }: { offset?: number } = {}) {
  const count = await prisma.proposal.count({
    where: {
      status: {
        not: 'published'
      }
    }
  });
  console.log('count remaining', count);

  const proposals = await prisma.proposal.findMany({
    where: {
      status: {
        not: 'published'
      }
    },
    include: {
      evaluations: true,
      page: {
        select: {
          snapshotProposalId: true,
          votes: {
            include: {
              voteOptions: true
            }
          }
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
    },
    orderBy: {
      id: 'asc'
    },
    skip: offset,
    take: perBatch
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
        const voteSettings: ProposalEvaluationInput['voteSettings'] = {
          threshold: vote?.threshold || 50,
          type: vote?.type || 'Approval',
          options: vote?.voteOptions.map((o) => o.name) || ['Yes', 'No', 'Abstain'],
          maxChoices: vote?.maxChoices || 1,
          publishToSnapshot: !!p.page?.snapshotProposalId,
          durationDays: vote ? Math.ceil((vote.deadline.getTime() - vote.createdAt.getTime()) / 1000 / 60 / 60 / 24) : 5
        };
        const result = votePassed ? 'pass' : voteFailed ? 'fail' : null;
        const reviewEvaluationId = uuid();
        await prisma.$transaction(async (tx) => {
          await tx.proposal.update({
            where: {
              id: p.id
            },
            data: {
              status: isPublished(p) ? 'published' : 'draft',
              workflowId: workflow?.id
            }
          });
          // @ts-ignore
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
              voteId: vote?.id,
              voteSettings,
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
        const rubricEvaluationId = uuid();
        await prisma.$transaction(async (tx) => {
          const workflow = p.space.proposalWorkflows.find((w) => w.title === 'Decision Matrix');
          await tx.proposal.update({
            where: {
              id: p.id
            },
            data: {
              status: isPublished(p) ? 'published' : 'draft',
              workflowId: workflow?.id
            }
          });
          // @ts-ignore
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
              id: rubricEvaluationId,
              title: 'Rubric evaluation',
              index: 1,
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

  if (proposals.length > 0) {
    console.log('checking', offset + perBatch, 'proposals. last id: ' + proposals[proposals.length - 1]?.id);
    return convertProposals({ offset: offset + perBatch });
  }
}
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

convertProposals()
  .then(() => {
    console.log('Done!');
  })
  .catch((e) => {
    console.error('Error!', e);
  });
