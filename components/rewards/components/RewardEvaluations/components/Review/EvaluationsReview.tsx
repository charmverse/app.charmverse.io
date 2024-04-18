import { Box, Collapse, FormLabel, Tooltip, Typography } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useState } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getRewardWorkflow } from 'lib/rewards/getRewardWorkflow';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

import type { EvaluationSettingsProps } from '../Settings/EvaluationsSettings';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';

export type Props = Omit<
  EvaluationSettingsProps,
  'onChangeWorkflow' | 'requireWorkflowChangeConfirmation' | 'rewardInput'
> & {
  reward?: RewardWithUsers;
};

export function EvaluationsReview({ reward, onChangeReward, expanded: expandedContainer, readOnly }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = getRewardWorkflow(workflowOptions, reward);
  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(undefined);
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);
  const [tempRewardUpdates, setTempRewardUpdates] = useState<UpdateableRewardFields | null>(null);
  const { showMessage } = useSnackbar();

  function openSettings(evaluation: RewardEvaluation) {
    setEvaluationInput(cloneDeep(evaluation));
  }

  function closeSettings() {
    setEvaluationInput(null);
    setTempRewardUpdates(null);
  }

  function updateEvaluation(updates: UpdateableRewardFields) {
    setTempRewardUpdates(updates);
  }

  async function saveEvaluation() {
    if (!tempRewardUpdates) return;
    try {
      await onChangeReward?.(tempRewardUpdates);
      closeSettings();
    } catch (error) {
      showMessage((error as Error).message ?? 'Something went wrong', 'error');
    }
  }

  const expandedEvaluationId = expandedContainer && _expandedEvaluationId;

  return (
    <LoadingComponent isLoading={!reward}>
      <Collapse in={expandedContainer}>
        <Tooltip title='Workflow can only be changed in Draft step'>
          <span>
            <WorkflowSelect options={workflowOptions} value={workflow?.id} readOnly />
          </span>
        </Tooltip>
      </Collapse>
      {workflow?.evaluations.map((evaluation, index) => {
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === expandedEvaluationId}
            expandedContainer={expandedContainer}
            isCurrent={false}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index}
            title={evaluation.title}
            result={null}
            actions={
              evaluation.type === 'apply' ? null : (
                <EvaluationStepActions canEdit={!readOnly} openSettings={() => openSettings(evaluation)} />
              )
            }
          >
            {evaluation.type === 'application_review' || evaluation.type === 'review' ? (
              <Box mb={2}>
                <FormLabel>
                  <Typography sx={{ mb: 1 }} variant='subtitle1'>
                    Reviewers
                  </Typography>
                </FormLabel>
                <UserAndRoleSelect
                  data-test='evaluation-reviewer-select'
                  readOnly={true}
                  value={reward?.reviewers ?? []}
                  onChange={() => {}}
                />
              </Box>
            ) : null}
          </EvaluationStepRow>
        );
      })}
      {evaluationInput && reward && (
        <EvaluationStepSettingsModal
          close={closeSettings}
          evaluationInput={evaluationInput}
          saveEvaluation={saveEvaluation}
          updateEvaluation={updateEvaluation}
          reward={{
            ...reward,
            ...tempRewardUpdates
          }}
        />
      )}
    </LoadingComponent>
  );
}
