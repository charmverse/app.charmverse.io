import { Collapse, Tooltip } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { RewardStatusBadge } from 'components/rewards/components/RewardStatusBadge';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { getCurrentRewardEvaluation } from 'lib/rewards/getCurrentRewardEvaluation';
import type { RewardEvaluation } from 'lib/rewards/getRewardWorkflows';
import { getRewardWorkflowWithApplication } from 'lib/rewards/getRewardWorkflowWithApplication';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { SubmitStepSettings } from '../Settings/components/SubmitSettings';
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
  const workflow = inferRewardWorkflow(workflowOptions, reward);

  const { currentEvaluation, updatedWorkflow } = useMemo(() => {
    const _updatedWorkflow = workflow
      ? getRewardWorkflowWithApplication({
          application,
          workflow
        })
      : workflow;

    const _currentEvaluation = _updatedWorkflow ? getCurrentRewardEvaluation(_updatedWorkflow) : null;

    return {
      updatedWorkflow: _updatedWorkflow,
      currentEvaluation: _currentEvaluation
    };
  }, [workflow, application]);

  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(currentEvaluation?.id);
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);
  const [tempRewardUpdates, setTempRewardUpdates] = useState<UpdateableRewardFields | null>(null);
  const { showMessage } = useSnackbar();

  useEffect(() => {
    if (currentEvaluation) {
      setExpandedEvaluationId(currentEvaluation.id);
    }
  }, [currentEvaluation]);

  function openSettings(evaluation: RewardEvaluation) {
    setEvaluationInput(cloneDeep(evaluation));
  }

  function closeSettings() {
    setEvaluationInput(null);
    setTempRewardUpdates(null);
  }

  function updateEvaluation(updates: UpdateableRewardFields) {
    setTempRewardUpdates({
      ...tempRewardUpdates,
      ...updates
    });
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
        const isCurrent = application ? currentEvaluation?.id === evaluation.id : false;
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === expandedEvaluationId}
            expandedContainer={expandedContainer}
            isCurrent={isCurrent}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index}
            title={evaluation.title}
            result={application ? evaluation.result ?? null : null}
            actions={
              evaluation.type === 'apply' || readOnly ? null : (
                <EvaluationStepActions canEdit openSettings={() => openSettings(evaluation)} />
              )
            }
          >
            {evaluation.type === 'application_review' || evaluation.type === 'review' ? (
              <ReviewStepReview
                reviewers={reward.reviewers ?? []}
                rewardId={reward.id}
                application={application}
                evaluation={evaluation}
                hideReviewResult={!isCurrent && evaluation.result === null}
              />
            ) : evaluation.type === 'payment' ? (
              <RewardStatusBadge noRewardText='No reward available' fullForm reward={reward} hideStatus truncate />
            ) : evaluation.type === 'submit' ? (
              <SubmitStepSettings readOnly onChange={() => {}} rewardInput={reward} />
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
