import { getWorkflowLimits } from '@packages/subscriptions/featureRestrictions';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';

import { useCurrentSpace } from './useCurrentSpace';

export function useWorkflowAccess() {
  const { space } = useCurrentSpace();
  const limits = getWorkflowLimits(space?.subscriptionTier);
  const { data: workflows = [] } = useGetProposalWorkflows(space?.id);

  const canCreateWorkflow = workflows.length < limits;

  return {
    canCreateWorkflow
  };
}
