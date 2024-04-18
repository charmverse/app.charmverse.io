import { Collapse } from '@mui/material';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { getRewardWorkflow } from 'lib/rewards/getRewardWorkflow';
import type { RewardWithUsers } from 'lib/rewards/interfaces';

export type Props = {
  reward?: Partial<Pick<RewardWithUsers, 'assignedSubmitters' | 'approveSubmitters'>>;
  readOnly?: boolean;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
};

export function EvaluationsSettings({
  reward,
  readOnly,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer
}: Props) {
  const isAdmin = useIsAdmin();
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = getRewardWorkflow(workflowOptions, reward);
  return (
    <LoadingComponent isLoading={!reward} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          options={workflowOptions}
          value={workflow?.id}
          readOnly={readOnly}
          required
          disableAddNew
          requireConfirmation={requireWorkflowChangeConfirmation}
        />
      </Collapse>
    </LoadingComponent>
  );
}
