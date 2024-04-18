import { Collapse } from '@mui/material';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { RewardWithUsers } from 'lib/rewards/interfaces';

export type Props = {
  reward?: RewardWithUsers;
  templateId?: string | null;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
};

function getRewardWorkflowId(reward: RewardWithUsers | undefined) {
  if (!reward) {
    return null;
  }

  if (reward.assignedSubmitters === null) {
    return reward.approveSubmitters ? 'application_required' : 'direct_submission';
  }

  return 'assigned';
}

export function EvaluationsSettings({
  reward,
  templateId,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer
}: Props) {
  const isAdmin = useIsAdmin();
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflowId = getRewardWorkflowId(reward);
  return (
    <LoadingComponent isLoading={!reward} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          options={workflowOptions}
          value={workflowId}
          readOnly={!!templateId && !isAdmin}
          required
          disableAddNew
          requireConfirmation={requireWorkflowChangeConfirmation}
        />
      </Collapse>
    </LoadingComponent>
  );
}
