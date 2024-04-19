import { Collapse } from '@mui/material';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import type { RewardInput } from 'lib/rewards/inferRewardWorkflow';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type EvaluationSettingsProps = {
  rewardInput?: RewardInput;
  readOnly?: boolean;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
  onChangeReward?: (updatedReward: UpdateableRewardFields) => void;
  onChangeWorkflow?: (workflow: RewardWorkflow) => void;
};

export function EvaluationsSettings({
  rewardInput,
  readOnly,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer,
  onChangeReward,
  onChangeWorkflow
}: EvaluationSettingsProps) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = inferRewardWorkflow(workflowOptions, rewardInput);
  return (
    <LoadingComponent isLoading={!rewardInput} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          options={workflowOptions}
          value={workflow?.id}
          readOnly={readOnly}
          required
          disableAddNew
          onChange={onChangeWorkflow}
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
              index={index}
            >
              {/** For apply evaluation use null to disable showing the AccordionDetails */}
              {evaluation.type === 'apply' ? null : (
                <EvaluationStepSettings
                  evaluation={evaluation}
                  readOnly={readOnly}
                  onChange={(updated) => {
                    onChangeReward?.(updated);
                  }}
                  rewardInput={rewardInput}
                />
              )}
            </EvaluationStepRow>
          );
        })}
    </LoadingComponent>
  );
}
