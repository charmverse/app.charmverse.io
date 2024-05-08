import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _cloneDeep from 'lodash/cloneDeep';

import type { ProposalWithUsersAndRubric } from './interfaces';

const privateEvaluationSteps: ProposalEvaluationType[] = ['rubric', 'pass_fail', 'vote'];

export async function concealProposalSteps({
  proposal,
  userId
}: {
  proposal: ProposalWithUsersAndRubric;
  userId?: string;
}) {
  if (!proposal.workflowId) {
    return proposal;
  }

  const workflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: proposal.workflowId
    },
    select: {
      privateEvaluations: true
    }
  });

  if (!workflow) {
    return proposal;
  }

  if (userId) {
    const applicableRoles = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRole: {
          spaceId: proposal.spaceId,
          userId
        }
      },
      select: {
        roleId: true
      }
    });

    const isReviewer = proposal.evaluations.some((evaluation) =>
      evaluation.reviewers.some(
        (reviewer) =>
          (!!reviewer.userId && reviewer.userId === userId) ||
          (!!reviewer.roleId && applicableRoles.some((role) => role.roleId === reviewer.roleId))
      )
    );

    if (isReviewer) {
      return proposal;
    }
  }

  const stepsWithoutConcealedEvaluations = proposal.evaluations.filter(
    (evaluation) => !privateEvaluationSteps.includes(evaluation.type)
  );

  stepsWithoutConcealedEvaluations.push({
    completedAt: null,
    decidedBy: null,
    draftRubricAnswers: [],
    id: 'concealed',
    index: stepsWithoutConcealedEvaluations.length,
    permissions: [],
    proposalId: proposal.id,
    result: null,
    reviewers: [],
    rubricAnswers: [],
    rubricCriteria: [],
    snapshotExpiry: null,
    snapshotId: null,
    title: 'Evaluation',
    type: 'private_evaluation',
    voteId: null,
    voteSettings: null,
    actionLabels: null,
    isReviewer: false
  });

  proposal.evaluations = stepsWithoutConcealedEvaluations;

  return proposal;
}
