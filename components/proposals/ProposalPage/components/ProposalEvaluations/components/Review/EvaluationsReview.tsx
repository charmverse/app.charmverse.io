import { Collapse, Divider, Tooltip } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';

import { EvaluationStepRow } from '../../../../../../common/workflows/EvaluationStepRow';
import { WorkflowSelect } from '../../../WorkflowSelect';
import type { ProposalEvaluationValues } from '../Settings/components/EvaluationStepSettings';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { PublishRewardsButton } from './components/PublishRewardsButton';
import { RubricEvaluation } from './components/RubricEvaluation/RubricEvaluation';
import { ProposalSocialShareLinks } from './components/SocialShare/ProposalSocialShareLinks';
import { VoteEvaluation } from './components/VoteEvaluation/VoteEvaluation';

export type Props = {
  pageId?: string;
  proposal?: Pick<
    ProposalWithUsersAndRubric,
    | 'archived'
    | 'id'
    | 'authors'
    | 'evaluations'
    | 'permissions'
    | 'status'
    | 'fields'
    | 'rewardIds'
    | 'workflowId'
    | 'currentEvaluationId'
    | 'page'
    | 'lensPostLink'
    | 'formId'
    | 'form'
  >;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  refreshProposal?: VoidFunction;
  templateId: string | null | undefined;
  pagePath?: string;
  pageTitle?: string;
  expanded: boolean;
};

export function EvaluationsReview({
  pagePath,
  pageTitle,
  pageId,
  proposal,
  onChangeEvaluation,
  refreshProposal,
  expanded: expandedContainer,
  templateId
}: Props) {
  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const { mappedFeatures } = useSpaceFeatures();
  const { showMessage } = useSnackbar();
  const [evaluationInput, setEvaluationInput] = useState<ProposalEvaluationValues | null>(null);
  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = Boolean(pendingRewards?.length || isRewardsComplete);
  const isRewardsActive = hasRewardsStep && currentEvaluation?.result === 'pass';
  // To find the previous step index. we have to calculate the position including Draft and Rewards steps
  let adjustedCurrentEvaluationIndex = 0; // "draft" step
  if (proposal && currentEvaluation) {
    adjustedCurrentEvaluationIndex = proposal.evaluations.findIndex((e) => e.id === currentEvaluation?.id) + 1;
    if (isRewardsActive) {
      adjustedCurrentEvaluationIndex += 1;
    }
  }

  const previousStepIndex = adjustedCurrentEvaluationIndex > 0 ? adjustedCurrentEvaluationIndex - 1 : null;

  function openSettings(evaluation: ProposalEvaluationValues) {
    // use clone deep to avoid changing deeply-nested objects like rubric criteria
    setEvaluationInput(cloneDeep(evaluation));
  }

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
        setExpandedEvaluationId('rewards');
      } else {
        setExpandedEvaluationId(proposal.currentEvaluationId);
      }
    }
  }, [proposal?.currentEvaluationId, isRewardsActive, setExpandedEvaluationId]);

  const expandedEvaluationId = expandedContainer && _expandedEvaluationId;

  return (
    <LoadingComponent isLoading={!proposal}>
      <Collapse in={expandedContainer}>
        <Tooltip title='Workflow can only be changed in Draft step'>
          <span>
            <WorkflowSelect value={proposal?.workflowId} readOnly />
          </span>
        </Tooltip>
      </Collapse>
      <EvaluationStepRow
        expandedContainer={expandedContainer}
        isCurrent={!proposal?.currentEvaluationId}
        index={0}
        result={proposal?.currentEvaluationId ? 'pass' : null}
        title='Draft'
        actions={
          <EvaluationStepActions
            isPreviousStep={previousStepIndex === 0}
            isCurrentStep={!proposal?.currentEvaluationId}
            permissions={proposal?.permissions}
            proposalId={proposal?.id}
            refreshProposal={refreshProposal}
            archived={proposal?.archived ?? false}
          />
        }
      />
      {proposal?.evaluations.map((evaluation, index) => {
        const isCurrentEval = currentEvaluation?.id === evaluation.id;
        const isCurrent = isCurrentEval && !isRewardsActive;
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={evaluation.id === expandedEvaluationId}
            expandedContainer={expandedContainer}
            isCurrent={isCurrent}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index + 1}
            result={evaluation.result}
            title={evaluation.title}
            actions={
              <EvaluationStepActions
                archived={proposal?.archived ?? false}
                isCurrentStep={isCurrent}
                isPreviousStep={previousStepIndex === index + 1}
                permissions={proposal?.permissions}
                proposalId={proposal?.id}
                refreshProposal={refreshProposal}
                evaluation={evaluation}
                openSettings={() => openSettings(evaluation)}
              />
            }
          >
            {evaluation.type === 'feedback' && (
              <FeedbackEvaluation
                archived={proposal?.archived ?? false}
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={isCurrent}
                nextStep={proposal.evaluations[index + 1]}
                onSubmit={refreshProposal}
              />
            )}
            {evaluation.type === 'pass_fail' && (
              <PassFailEvaluation
                archived={proposal?.archived ?? false}
                key={evaluation.id}
                evaluation={evaluation}
                proposalId={proposal?.id}
                isCurrent={isCurrent}
                refreshProposal={refreshProposal}
              />
            )}
            {evaluation.type === 'rubric' && (
              <RubricEvaluation
                key={evaluation.id}
                proposal={proposal}
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
                refreshProposal={refreshProposal}
              />
            )}
          </EvaluationStepRow>
        );
      })}
      {hasRewardsStep && (
        <EvaluationStepRow
          expanded={expandedEvaluationId === 'rewards'}
          expandedContainer={expandedContainer}
          isCurrent={isRewardsActive}
          onChange={(e, expand) => setExpandedEvaluationId(expand ? 'rewards' : undefined)}
          index={proposal ? proposal.evaluations.length + 1 : 0}
          result={isRewardsComplete ? 'pass' : null}
          title={rewardsTitle}
        >
          <PublishRewardsButton
            disabled={!(proposal?.permissions.evaluate && isRewardsActive && !isRewardsComplete) || !!proposal.archived}
            proposalId={proposal?.id}
            pendingRewards={pendingRewards}
            rewardIds={proposal?.rewardIds}
            onSubmit={refreshProposal}
          />
        </EvaluationStepRow>
      )}
      {pagePath && pageTitle && proposal && expandedContainer && (
        <>
          <Divider />
          <ProposalSocialShareLinks
            lensPostLink={proposal.lensPostLink}
            proposalId={proposal.id}
            proposalPath={pagePath}
            proposalTitle={pageTitle}
            proposalAuthors={proposal.authors.map((a) => a.userId)}
          />
        </>
      )}
      {evaluationInput && (
        <EvaluationStepSettingsModal
          close={closeSettings}
          evaluationInput={evaluationInput}
          templateId={templateId}
          saveEvaluation={saveEvaluation}
          updateEvaluation={updateEvaluation}
        />
      )}
    </LoadingComponent>
  );
}
