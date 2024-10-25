import { hasAccessToSpace } from '@charmverse/core/permissions';
import type {
  ProposalAppealReviewer,
  ProposalAuthor,
  ProposalEvaluationType,
  ProposalReviewer
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { privateEvaluationSteps } from '@charmverse/core/proposals';
import { getAssignedRoleIds } from '@root/lib/roles/getAssignedRoleIds';

import type { ProposalWithUsersAndRubric } from './interfaces';

export type MinimalProposal = Pick<ProposalWithUsersAndRubric, 'spaceId' | 'workflowId' | 'id'> & {
  workflow?: { privateEvaluations: boolean | null };
  reviewers?: ProposalReviewer[];
  appealReviewers?: ProposalAppealReviewer[];
} & {
  evaluations: (Pick<ProposalWithUsersAndRubric['evaluations'][0], 'id' | 'type' | 'result' | 'index' | 'reviewers'> &
    Partial<ProposalWithUsersAndRubric['evaluations'][0]>)[];
  authors: Pick<ProposalAuthor, 'userId'>[];
};

export async function concealProposalSteps<T extends MinimalProposal = MinimalProposal>({
  proposal,
  userId,
  applicableRoleIds,
  isAdmin
}: {
  proposal: T;
  userId?: string;
  applicableRoleIds?: string[];
  isAdmin?: boolean;
}) {
  if (!proposal.workflowId) {
    return proposal;
  }

  const workflow =
    proposal.workflow ??
    (await prisma.proposalWorkflow.findUnique({
      where: {
        id: proposal.workflowId
      },
      select: {
        privateEvaluations: true
      }
    }));

  if (!workflow || !workflow.privateEvaluations) {
    return proposal;
  }

  // Search conditions allowing for early exit without needing to conceal the evaluation steps
  if (userId) {
    const _isAdmin =
      typeof isAdmin === 'boolean'
        ? isAdmin
        : await hasAccessToSpace({
            spaceId: proposal.spaceId,
            userId
          }).then((data) => !!data.isAdmin);

    if (_isAdmin) {
      return proposal;
    }

    const applicableRoles = applicableRoleIds ?? (await getAssignedRoleIds({ spaceId: proposal.spaceId, userId }));

    const isReviewer = proposal.evaluations.some(
      (evaluation) =>
        privateEvaluationSteps.includes(evaluation.type as ProposalEvaluationType) &&
        evaluation.reviewers.some(
          (reviewer) =>
            (!!reviewer.userId && reviewer.userId === userId) ||
            (!!reviewer.roleId && applicableRoles?.includes(reviewer.roleId))
        )
    );

    const isAppealReviewer = proposal.evaluations.some(
      (evaluation) =>
        privateEvaluationSteps.includes(evaluation.type as ProposalEvaluationType) &&
        evaluation.appealReviewers?.some(
          (reviewer) =>
            (!!reviewer.userId && reviewer.userId === userId) ||
            (!!reviewer.roleId && applicableRoles?.includes(reviewer.roleId))
        )
    );

    if (isReviewer || isAppealReviewer) {
      return proposal;
    }
  }

  const stepsWithCollapsedEvaluations: MinimalProposal['evaluations'][number][] = [];

  const isAuthor = proposal.authors.some((author) => author.userId === userId);

  for (let i = 0; i < proposal.evaluations.length; i++) {
    const previousStep = stepsWithCollapsedEvaluations[stepsWithCollapsedEvaluations.length - 1];
    const currentStep = proposal.evaluations[i];

    const isConcealableEvaluation = privateEvaluationSteps.includes(currentStep.type as ProposalEvaluationType);
    if (
      !isConcealableEvaluation ||
      (isAuthor &&
        currentStep.type === 'rubric' &&
        currentStep.result === 'fail' &&
        currentStep.showAuthorResultsOnRubricFail)
    ) {
      stepsWithCollapsedEvaluations.push(currentStep);
    } else if (previousStep?.type !== 'private_evaluation') {
      stepsWithCollapsedEvaluations.push({
        completedAt: null,
        decidedBy: null,
        draftRubricAnswers: [],
        id: currentStep.id,
        index: currentStep.index,
        permissions: [],
        proposalId: proposal.id,
        result: currentStep.result,
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
    } else if (previousStep.result) {
      previousStep.id = currentStep.id;
      if (previousStep.result !== 'fail') {
        previousStep.result = currentStep.result;
      }
    }
  }

  proposal.evaluations = stepsWithCollapsedEvaluations;
  proposal.reviewers = [];

  return proposal;
}
