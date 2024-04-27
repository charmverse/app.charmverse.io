import { Collapse } from '@mui/material';
import { useMemo } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type EvaluationSettingsProps = {
  rewardInput?: UpdateableRewardFields;
  readOnly?: boolean;
  isTemplate: boolean;
  requireWorkflowChangeConfirmation?: boolean;
  expanded?: boolean;
  onChangeReward?: (updatedReward: UpdateableRewardFields) => void;
  onChangeWorkflow?: (workflow: RewardWorkflow) => void;
  isUnpublishedReward?: boolean;
};

export function EvaluationsSettings({
  rewardInput,
  isTemplate,
  readOnly,
  isUnpublishedReward,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer,
  onChangeReward,
  onChangeWorkflow
}: EvaluationSettingsProps) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = inferRewardWorkflow(workflowOptions, rewardInput);
  const transformedWorkflow = useMemo(() => {
    // Make sure to remove credential step if a new reward is created without any credential templates
    if (!workflow) {
      return undefined;
    }

    if (isUnpublishedReward && (rewardInput?.selectedCredentialTemplates ?? []).length === 0) {
      return {
        ...workflow,
        evaluations: workflow.evaluations.filter((evaluation) => evaluation.type !== 'credential')
      };
    }

    return workflow;
  }, [workflow, rewardInput, isUnpublishedReward]);

  return (
    <LoadingComponent isLoading={!rewardInput} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          options={workflowOptions}
          value={transformedWorkflow?.id}
          readOnly={readOnly}
          required
          disableAddNew
          onChange={onChangeWorkflow}
          requireConfirmation={requireWorkflowChangeConfirmation}
        />
      </Collapse>
      {transformedWorkflow &&
        transformedWorkflow.evaluations.map((evaluation, index) => {
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
                  isTemplate={isTemplate}
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
