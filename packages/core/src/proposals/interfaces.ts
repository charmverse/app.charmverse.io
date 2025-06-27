import type {
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalWorkflow
} from '@charmverse/core/prisma-client';

/**
 * @onlyAssigned - If the user is an author or reviewer on this proposal
 */
export type ListProposalsRequest = {
  userId?: string;
  spaceId: string;
  onlyAssigned?: boolean;
};

// Workflows - the evaluations and permissions are stored in Json for ease of use

export type PermissionJson = Pick<ProposalEvaluationPermission, 'operation'> &
  Partial<Pick<ProposalEvaluationPermission, 'roleId' | 'userId' | 'systemRole'>>;

// we keep the id for JSON because it makes easy to manage sorting the list of evaluations in React
export type WorkflowEvaluationJson = Pick<ProposalEvaluation, 'id' | 'title' | 'type'> & {
  permissions: PermissionJson[];
  declineReasons?: string[] | null;
  requiredReviews?: number | null;
  finalStep?: boolean | null;
  appealable?: boolean | null;
  appealRequiredReviews?: number | null;
  actionLabels?: {
    approve?: string;
    reject?: string;
  } | null;
  notificationLabels?: {
    approve?: string;
    reject?: string;
  } | null;
  dueDate?: Date | null;
  showAuthorResultsOnRubricFail?: boolean | null;
};

export type ProposalWorkflowTyped = Omit<ProposalWorkflow, 'evaluations'> & {
  evaluations: WorkflowEvaluationJson[];
};
