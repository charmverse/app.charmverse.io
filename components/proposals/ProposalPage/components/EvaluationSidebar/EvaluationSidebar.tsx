import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import type { ProposalEvaluationValues } from '../EvaluationSettingsSidebar/components/EvaluationStepSettings';
import { EvaluationStepSettings } from '../EvaluationSettingsSidebar/components/EvaluationStepSettings';
import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepRow } from './components/EvaluationStepRow';
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
  const [evaluationInput, setEvaluationInput] = useState<ProposalEvaluationValues | null>(null);
  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = Boolean(pendingRewards?.length || isRewardsComplete);
  const isRewardsActive = currentEvaluation?.result === 'pass';
  const isFromTemplate = !!proposal?.page?.sourceTemplateId;
  // To find the previous step index. we have to calculate the position including Draft and Rewards steps
  let adjustedCurrentEvaluationIndex = 0; // "draft" step
  if (proposal && currentEvaluation) {
    adjustedCurrentEvaluationIndex = proposal.evaluations.findIndex((e) => e.id === currentEvaluation?.id) + 1;
    if (hasRewardsStep && isRewardsActive) {
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
    await onChangeEvaluation?.(newEvaluation.id, newEvaluation);
    closeSettings();
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
      {proposal?.evaluations.map((evaluation, index) => (
        <EvaluationStepRow
          key={evaluation.id}
          expanded={evaluation.id === activeEvaluationId}
          isCurrent={evaluation.id === proposal?.currentEvaluationId && !isRewardsActive}
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
              isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
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
              isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
              isReviewer={proposal?.permissions.evaluate}
              refreshProposal={refreshProposal}
            />
          )}
          {evaluation.type === 'rubric' && (
            <RubricEvaluation
              key={evaluation.id}
              proposal={proposal}
              isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
              evaluation={evaluation}
              refreshProposal={refreshProposal}
            />
          )}
          {evaluation.type === 'vote' && (
            <VoteEvaluation
              key={evaluation.id}
              pageId={pageId!}
              proposal={proposal}
              isCurrent={currentEvaluation?.id === evaluation.id && !isRewardsActive}
              evaluation={evaluation}
            />
          )}
        </EvaluationStepRow>
      ))}
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
        <Modal open onClose={closeSettings} title={`Edit ${evaluationInput?.title}`}>
          <Box mb={1}>
            <EvaluationStepSettings
              readOnly={false}
              readOnlyReviewers={isFromTemplate}
              readOnlyRubricCriteria={isFromTemplate}
              evaluation={evaluationInput}
              onChange={updateEvaluation}
            />
          </Box>
          <Box display='flex' justifyContent='flex-end' gap={1}>
            <Button color='secondary' variant='outlined' onClick={closeSettings}>
              Cancel
            </Button>
            <Button onClick={() => saveEvaluation(evaluationInput)}>Save</Button>
          </Box>
        </Modal>
      )}
    </div>
  );
}
