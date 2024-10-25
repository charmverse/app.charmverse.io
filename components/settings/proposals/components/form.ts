import type { ProposalEvaluationType, ProposalOperation, ProposalSystemRole } from '@charmverse/core/prisma-client';

export type EvaluationStepFormValues = {
  id: string;
  title: string;
  type: ProposalEvaluationType;
  actionLabels?: {
    approve?: string;
    reject?: string;
  } | null;
  notificationLabels?: {
    approve?: string;
    reject?: string;
  } | null;
  requiredReviews?: number;
  declineReasons?: string[] | null;
  finalStep?: boolean | null;
  permissions: {
    operation: ProposalOperation;
    userId?: string | null;
    roleId?: string | null;
    systemRole?: ProposalSystemRole | null;
  }[];
  appealable?: boolean | null;
  appealRequiredReviews?: number | null;
  showAuthorResultsOnRubricFail?: boolean | null;
};
