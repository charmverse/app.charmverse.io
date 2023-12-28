import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

import { WorkflowSelect } from '../WorkflowSelect';

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
  >;
  refreshProposal?: VoidFunction;
};

export function EvaluationSidebar({ pageId, proposal, refreshProposal }: Props) {
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = (proposal?.fields as ProposalFields)?.pendingRewards;
  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = !!pendingRewards?.length || isRewardsComplete;
  const isRewardsActive = currentEvaluation?.result === 'pass';

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
        position={1}
        result={proposal?.currentEvaluationId ? 'pass' : null}
        title='Draft'
      />
      {proposal?.evaluations.map((evaluation, index) => (
        <EvaluationStepRow
          key={evaluation.id}
          expanded={evaluation.id === activeEvaluationId}
          isCurrent={evaluation.id === proposal?.currentEvaluationId && !isRewardsActive}
          onChange={(e, expand) => setActiveEvaluationId(expand ? evaluation.id : undefined)}
          position={index + 2}
          result={evaluation.result}
          title={evaluation.title}
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
          position={proposal ? proposal.evaluations.length + 2 : 0}
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
    </div>
  );
}
