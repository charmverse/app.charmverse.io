import { Collapse } from '@mui/material';
import { useMemo } from 'react';

import { useGetRewardWorkflows, useGetRewardTemplate } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/WorkflowSidebar/components/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/WorkflowSidebar/components/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { RewardFields } from '@packages/lib/rewards/blocks/interfaces';
import { type RewardWorkflow } from '@packages/lib/rewards/getRewardWorkflows';
import { inferRewardWorkflow } from '@packages/lib/rewards/inferRewardWorkflow';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type EvaluationSettingsProps = {
  rewardInput?: UpdateableRewardFields;
  readOnly: boolean;
  isTemplate: boolean;
  templateId: string | null | undefined;
  expanded: boolean;
  onChangeReward: (updatedReward: UpdateableRewardFields) => void;
  // onChangeTemplate: (value: { id: string } | null) => void;
  onChangeWorkflow?: (workflow: RewardWorkflow) => void; // this prop is not used on application pages
  isUnpublishedReward?: boolean;
};

export function EvaluationsSettings({
  rewardInput,
  isTemplate,
  readOnly,
  templateId,
  isUnpublishedReward,
  expanded: expandedContainer,
  onChangeReward,
  // onChangeTemplate,
  onChangeWorkflow
}: EvaluationSettingsProps) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const { data: rewardTemplate } = useGetRewardTemplate(templateId);
  const workflow = rewardInput?.fields && inferRewardWorkflow(workflowOptions, rewardInput.fields as RewardFields);
  const transformedWorkflow = useMemo(() => {
    // Make sure to remove credential step if a new reward is created using a credential less template
    if (!workflow) {
      return undefined;
    }

    if (isUnpublishedReward && (rewardInput?.selectedCredentialTemplates ?? []).length === 0 && templateId) {
      return {
        ...workflow,
        evaluations: workflow.evaluations.filter((evaluation) => evaluation.type !== 'credential')
      };
    }

    return workflow;
  }, [workflow, rewardInput, isUnpublishedReward, templateId]);

  return (
    <LoadingComponent isLoading={!rewardInput} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        {/* <TemplateSelect onChange={onChangeTemplate} options={templatePageOptions} value={templateId} readOnly /> */}
        <WorkflowSelect
          options={workflowOptions}
          value={transformedWorkflow?.id}
          readOnly={readOnly}
          required
          onChange={onChangeWorkflow}
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
                  rewardTemplateInput={rewardTemplate}
                  readOnly={readOnly}
                  onChange={(updated) => {
                    onChangeReward?.(updated);
                  }}
                  workflowId={transformedWorkflow.id}
                  rewardInput={rewardInput}
                />
              )}
            </EvaluationStepRow>
          );
        })}
    </LoadingComponent>
  );
}
