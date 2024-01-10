import type { ProposalOperation } from '@charmverse/core/prisma';
import { ProposalSystemRole } from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { v4 as uuid } from 'uuid';

export function getDefaultPermissions() {
  return [
    // author permissions
    ...['view', 'edit', 'comment', 'move'].map((operation) => ({
      operation: operation as ProposalOperation,
      systemRole: ProposalSystemRole.author
    })),
    // reviewer permissions
    ...['view', 'comment', 'move'].map((operation) => ({
      operation: operation as ProposalOperation,
      systemRole: ProposalSystemRole.current_reviewer
    })),
    // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
    ...['view', 'comment'].map((operation) => ({
      operation: operation as ProposalOperation,
      systemRole: ProposalSystemRole.all_reviewers
    })),
    // member permissions
    ...['view', 'comment'].map((operation) => ({
      operation: operation as ProposalOperation,
      systemRole: ProposalSystemRole.space_member
    }))
  ];
}

export function getDefaultEvaluation(evaluation?: Partial<WorkflowEvaluationJson>): WorkflowEvaluationJson {
  return {
    id: uuid(),
    title: '',
    type: 'pass_fail',
    permissions: getDefaultPermissions(),
    ...evaluation
  };
}

export function getDefaultFeedbackEvaluation(evaluation?: Partial<WorkflowEvaluationJson>): WorkflowEvaluationJson {
  return {
    id: uuid(),
    title: 'Feedback',
    type: 'feedback',
    permissions: [
      // author permissions
      ...['view', 'edit', 'comment', 'move'].map((operation) => ({
        operation: operation as ProposalOperation,
        systemRole: ProposalSystemRole.author
      })),
      // member permissions
      ...['view', 'comment'].map((operation) => ({
        operation: operation as ProposalOperation,
        systemRole: ProposalSystemRole.space_member
      }))
    ],
    ...evaluation
  };
}
