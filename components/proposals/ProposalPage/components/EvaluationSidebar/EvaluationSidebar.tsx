import { useEffect, useState } from 'react';

import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import type { ProposalEvaluationValues } from '../EvaluationSettingsSidebar/components/EvaluationStepSettings';
import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepRow } from './components/EvaluationStepRow';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { PublishRewardsButton } from './components/PublishRewardsButton';
import { RubricEvaluation } from './components/RubricEvaluation/RubricEvaluation';
import { VoteEvaluation } from './components/VoteEvaluation';

export type Props = {
  pageId?: string;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    | 'id'
    | 'authors'
    | 'evaluations'
    | 'permissions'
    | 'status'
    | 'evaluationType'
    | 'fields'
    | 'rewardIds'
    | 'workflowId'
    | 'currentEvaluationId'
    | 'page'
  >;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  refreshProposal?: VoidFunction;
};

export function EvaluationSidebar({ pageId, proposal, onChangeEvaluation, refreshProposal }: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const { mappedFeatures } = useSpaceFeatures();
  const { showMessage } = useSnackbar();
  const [evaluationInput, setEvaluationInput] = useState<ProposalEvaluationValues | null>(null);
  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = Boolean(pendingRewards?.length || isRewardsComplete);
  const isRewardsActive = hasRewardsStep && currentEvaluation?.result === 'pass';
  const isFromTemplate = !!proposal?.page?.sourceTemplateId;
  // To find the previous step index. we have to calculate the position including Draft and Rewards steps
  let adjustedCurrentEvaluationIndex = 0; // "draft" step
  if (proposal && currentEvaluation) {
    adjustedCurrentEvaluationIndex = proposal.evaluations.findIndex((e) => e.id === currentEvaluation?.id) + 1;
    if (isRewardsActive) {
      adjustedCurrentEvaluationIndex += 1;
    }
  }

  const previousStepIndex = adjustedCurrentEvaluationIndex > 0 ? adjustedCurrentEvaluationIndex - 1 : null;

  function closeSettings() {
    setEvaluationInput(null);
  }

  function updateEvaluation(updated: Partial<ProposalEvaluationValues>) {
    setEvaluationInput((input) => ({ ...(input as ProposalEvaluationValues), ...updated }));
  }

  async function saveEvaluation(newEvaluation: ProposalEvaluationValues) {
    try {
      await onChangeEvaluation?.(newEvaluation.id, newEvaluation);
      closeSettings();
    } catch (error) {
      showMessage((error as Error).message ?? 'Something went wrong', 'error');
    }
  }

  useEffect(() => {
    // expand the current evaluation
    if (proposal?.currentEvaluationId) {
      if (isRewardsActive) {
        setActiveEvaluationId('rewards');
      } else {
        setActiveEvaluationId(proposal.currentEvaluationId);
      }
    }
  }, [proposal?.currentEvaluationId, isRewardsActive, setActiveEvaluationId]);

  return (
    <div>
      <WorkflowSelect value={proposal?.workflowId} readOnly />
      <EvaluationStepRow
        isCurrent={!proposal?.currentEvaluationId}
        index={0}
        result={proposal?.currentEvaluationId ? 'pass' : null}
        title='Draft'
        actions={
          <EvaluationStepActions
            isPreviousStep={previousStepIndex === 0}
            permissions={proposal?.permissions}
            proposalId={proposal?.id}
            refreshProposal={refreshProposal}
            openSettings={setEvaluationInput}
          />
        }
      />
      {proposal?.evaluations.map((evaluation, index) => {
        const isCurrentEval = currentEvaluation?.id === evaluation.id;
        const isCurrent = isCurrentEval && !isRewardsActive;
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === activeEvaluationId}
            isCurrent={isCurrent}
            onChange={(e, expand) => setActiveEvaluationId(expand ? evaluation.id : undefined)}
            index={index + 1}
            result={evaluation.result}
            title={evaluation.title}
            actions={
              <EvaluationStepActions
                isPreviousStep={previousStepIndex === index + 1}
                permissions={proposal?.permissions}
                proposalId={proposal?.id}
                refreshProposal={refreshProposal}
                evaluation={evaluation}
                openSettings={(e) => setEvaluationInput({ ...e })}
              />
            }
          >
            {evaluation.type === 'feedback' && (
              <FeedbackEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={isCurrent}
                nextStep={proposal.evaluations[index + 1]}
                hasMovePermission={proposal.permissions.move}
                onSubmit={refreshProposal}
              />
            )}
            {evaluation.type === 'pass_fail' && (
              <PassFailEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={isCurrent}
                isReviewer={proposal?.permissions.evaluate}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation.type === 'rubric' && (
              <RubricEvaluation
                key={evaluation.id}
                proposal={proposal}
                permissions={isCurrentEval ? proposal?.permissions : undefined}
                isCurrent={isCurrent}
                evaluation={evaluation}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation.type === 'vote' && (
              <VoteEvaluation
                key={evaluation.id}
                pageId={pageId!}
                proposal={proposal}
                isCurrent={isCurrent}
                evaluation={evaluation}
              />
            )}
          </EvaluationStepRow>
        );
      })}
      {hasRewardsStep && (
        <EvaluationStepRow
          expanded={activeEvaluationId === 'rewards'}
          isCurrent={isRewardsActive}
          onChange={(e, expand) => setActiveEvaluationId(expand ? 'rewards' : undefined)}
          index={proposal ? proposal.evaluations.length + 1 : 0}
          result={isRewardsComplete ? 'pass' : null}
          title={rewardsTitle}
        >
          <PublishRewardsButton
            disabled={!(proposal?.permissions.evaluate && isRewardsActive && !isRewardsComplete)}
            proposalId={proposal?.id}
            pendingRewards={pendingRewards}
            rewardIds={proposal?.rewardIds}
            onSubmit={refreshProposal}
          />
        </EvaluationStepRow>
      )}
      {evaluationInput && (
        <EvaluationStepSettingsModal
          close={closeSettings}
          evaluationInput={evaluationInput}
          isFromTemplate={isFromTemplate}
          saveEvaluation={saveEvaluation}
          updateEvaluation={updateEvaluation}
        />
      )}
    </div>
  );
}
