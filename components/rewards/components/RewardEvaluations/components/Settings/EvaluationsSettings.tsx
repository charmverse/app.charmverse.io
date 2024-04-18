import { Collapse } from '@mui/material';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RewardInput } from 'lib/rewards/getRewardWorkflow';
import { getRewardWorkflow } from 'lib/rewards/getRewardWorkflow';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type EvaluationSettingsProps = {
  reward?: RewardInput;
  readOnly?: boolean;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
  onChangeEvaluation: (evaluationId: string, updatedEvaluation: UpdateableRewardFields) => void;
};

export function EvaluationsSettings({
  reward,
  readOnly,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer,
  onChangeEvaluation
}: EvaluationSettingsProps) {
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
      {workflow &&
        workflow.evaluations.map((evaluation, index) => {
          return (
            <EvaluationStepRow
              key={evaluation.id}
              expanded={expandedContainer}
              expandedContainer={expandedContainer}
              result={null}
              title={evaluation.title}
              index={index + 1}
            >
              <EvaluationStepSettings
                evaluation={evaluation}
                readOnly={readOnly}
                onChange={(updated) => {
                  onChangeEvaluation?.(evaluation.id, updated);
                }}
                reward={reward}
              />
            </EvaluationStepRow>
          );
        })}
    </LoadingComponent>
  );
}
