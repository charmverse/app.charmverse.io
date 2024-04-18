import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { Box, Collapse, Tooltip } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useState } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { TokenBadge } from 'components/common/TokenBadge';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getCurrentRewardEvaluation } from 'lib/rewards/getCurrentRewardEvaluation';
import { getRewardWorkflow } from 'lib/rewards/getRewardWorkflow';
import { getRewardWorkflowWithApplication } from 'lib/rewards/getRewardWorkflowWithApplication';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

import type { EvaluationSettingsProps } from '../Settings/EvaluationsSettings';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { ReviewStepReview } from './components/ReviewStepReview';

export type Props = Omit<
  EvaluationSettingsProps,
  'onChangeWorkflow' | 'requireWorkflowChangeConfirmation' | 'rewardInput'
> & {
  reward: RewardWithUsers;
  application?: ApplicationWithTransactions;
};

export function EvaluationsReview({
  application,
  reward,
  onChangeReward,
  expanded: expandedContainer,
  readOnly
}: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = getRewardWorkflow(workflowOptions, reward);
  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(undefined);
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);
  const [tempRewardUpdates, setTempRewardUpdates] = useState<UpdateableRewardFields | null>(null);
  const { showMessage } = useSnackbar();

  const updatedWorkflow =
    application && workflow
      ? getRewardWorkflowWithApplication({
          application,
          workflow
        })
      : workflow;

  const currentEvaluation = updatedWorkflow ? getCurrentRewardEvaluation(updatedWorkflow) : null;

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
      {updatedWorkflow?.evaluations.map((evaluation, index) => {
        const isCurrent = currentEvaluation?.id === evaluation.id;
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === expandedEvaluationId}
            expandedContainer={expandedContainer}
            isCurrent={application ? isCurrent : false}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index}
            title={evaluation.title}
            result={application ? evaluation.result ?? null : null}
            actions={
              evaluation.type === 'apply' ? null : (
                <EvaluationStepActions canEdit={!readOnly} openSettings={() => openSettings(evaluation)} />
              )
            }
          >
            {evaluation.type === 'application_review' || evaluation.type === 'review' ? (
              <ReviewStepReview
                reviewers={reward.reviewers ?? []}
                rewardId={reward.id}
                application={application}
                evaluation={evaluation}
              />
            ) : evaluation.type === 'payment' ? (
              <Box mb={2}>
                <TokenBadge
                  tokenAmount={reward.rewardAmount}
                  chainId={reward.chainId}
                  tokenAddress={reward.rewardToken}
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
