import { Collapse, Divider, Tooltip } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useEffect, useState } from 'react';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { SocialShareLinksStep } from 'components/common/WorkflowSidebar/components/SocialShareLinksStep/SocialShareLinksStep';
import { WorkflowSelect } from 'components/common/WorkflowSidebar/components/WorkflowSelect';
import { CredentialSelect } from 'components/credentials/CredentialsSelect';
import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import { getAbsolutePath } from 'lib/utils/browser';

import { EvaluationStepRow } from '../../../../../../common/WorkflowSidebar/components/EvaluationStepRow';
import type { ProposalEvaluationValues } from '../Settings/components/EvaluationStepSettings';

import { EditStepButton } from './components/EditStepButton';
import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { FeedbackEvaluation } from './components/FeedbackEvaluation';
import { PassFailEvaluation } from './components/PassFailEvaluation';
import { ProposalCredentials } from './components/ProposalCredentials/ProposalCredentials';
import { RewardReviewStep } from './components/RewardReviewStep';
import { RubricEvaluation } from './components/RubricEvaluation/RubricEvaluation';
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
    | 'formId'
    | 'form'
    | 'selectedCredentialTemplates'
    | 'issuedCredentials'
  >;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnlyCredentialTemplates?: boolean;
  onChangeSelectedCredentialTemplates?: (templates: string[]) => void;
  refreshProposal?: VoidFunction;
  templateId: string | null | undefined;
  pagePath?: string;
  pageLensPostLink?: string | null;
  pageTitle?: string;
  expanded: boolean;
  refreshPage?: VoidFunction;
};

export function EvaluationsReview({
  pagePath,
  pageTitle,
  pageId,
  proposal,
  pageLensPostLink,
  onChangeEvaluation,
  onChangeSelectedCredentialTemplates,
  readOnlyCredentialTemplates,
  refreshProposal: _refreshProposal,
  expanded: expandedContainer,
  templateId,
  refreshPage
}: Props) {
  const [_expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(proposal?.currentEvaluationId);
  const { mappedFeatures } = useSpaceFeatures();
  const { showMessage } = useSnackbar();
  const [evaluationInput, setEvaluationInput] = useState<ProposalEvaluationValues | null>(null);
  const [showEditCredentials, setShowEditCredentials] = useState(false);
  const { hasPendingOnchainCredentials, refreshIssuableCredentials } = useProposalCredentials({
    proposalId: proposal?.id
  });

  const rewardsTitle = mappedFeatures.rewards.title;
  const currentEvaluation = proposal?.evaluations.find((e) => e.id === proposal?.currentEvaluationId);
  const pendingRewards = proposal?.fields?.pendingRewards;
  const hasCredentialsStep = !!proposal?.selectedCredentialTemplates.length || !!proposal?.issuedCredentials.length;

  const isRewardsComplete = !!proposal?.rewardIds?.length;
  const hasRewardsStep = Boolean(pendingRewards?.length || isRewardsComplete);

  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetProposalWorkflows(currentSpace?.id);
  const isCredentialsComplete =
    hasCredentialsStep && currentEvaluation?.result === 'pass' && !hasPendingOnchainCredentials;
  const isCredentialsActive =
    hasCredentialsStep && currentEvaluation?.result === 'pass' && (!isCredentialsComplete || !hasRewardsStep);

  const shareLink = getAbsolutePath(pagePath || '', currentSpace?.domain);
  const shareText = `${pageTitle || 'Untitled'} from ${currentSpace?.name} is now open for feedback.\n`;
  const { user } = useUser();
  const isRewardsActive =
    hasRewardsStep && currentEvaluation?.result === 'pass' && (!hasCredentialsStep || !!isCredentialsComplete);
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

  async function refreshProposal() {
    await refreshIssuableCredentials();
    await _refreshProposal?.();
    await refreshPage?.();
  }

  useEffect(() => {
    // expand the current evaluation
    if (proposal?.currentEvaluationId) {
      if (isRewardsActive) {
        setExpandedEvaluationId('rewards');
      } else if (isCredentialsActive) {
        setExpandedEvaluationId('credentials');
      } else {
        setExpandedEvaluationId(proposal.currentEvaluationId);
      }
    }
  }, [proposal?.currentEvaluationId, isRewardsActive, isCredentialsActive, setExpandedEvaluationId]);

  const expandedEvaluationId = expandedContainer && _expandedEvaluationId;

  return (
    <LoadingComponent isLoading={!proposal}>
      <Collapse in={expandedContainer}>
        <Tooltip title='Workflow can only be changed in Draft step'>
          <span>
            <WorkflowSelect options={workflowOptions} value={proposal?.workflowId} readOnly />
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
        const isCurrent = isCurrentEval && !isCredentialsActive && !isRewardsActive;
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
      {hasCredentialsStep && (
        <EvaluationStepRow
          expanded={expandedEvaluationId === 'credentials'}
          expandedContainer={expandedContainer}
          isCurrent={isCredentialsActive}
          onChange={(e, expand) => setExpandedEvaluationId(expand ? 'credentials' : undefined)}
          index={proposal ? proposal.evaluations.length + 1 : 0}
          result={isCredentialsComplete ? 'pass' : null}
          title='Credentials'
          actions={
            <EditStepButton
              readOnlyTooltip='You cannot edit credentials'
              readOnly={readOnlyCredentialTemplates}
              onClick={() => setShowEditCredentials(true)}
            />
          }
        >
          <ProposalCredentials
            selectedCredentialTemplates={proposal.selectedCredentialTemplates}
            proposalId={proposal.id}
          />
        </EvaluationStepRow>
      )}
      {hasRewardsStep && (
        <EvaluationStepRow
          expanded={expandedEvaluationId === 'rewards'}
          expandedContainer={expandedContainer}
          isCurrent={isRewardsActive}
          onChange={(e, expand) => setExpandedEvaluationId(expand ? 'rewards' : undefined)}
          index={proposal ? proposal.evaluations.length + (hasCredentialsStep ? 2 : 1) : 0}
          result={isRewardsComplete ? 'pass' : null}
          title={rewardsTitle}
        >
          <RewardReviewStep
            disabled={!(proposal?.permissions.evaluate && isRewardsActive && !isRewardsComplete) || !!proposal.archived}
            proposalId={proposal?.id}
            pendingRewards={pendingRewards}
            rewardIds={proposal?.rewardIds}
            onSubmit={refreshProposal}
          />
        </EvaluationStepRow>
      )}
      {pagePath && pageId && pageTitle && proposal && expandedContainer && (
        <>
          <Divider />
          <SocialShareLinksStep
            pageId={pageId}
            lensPostLink={pageLensPostLink}
            onPublish={refreshProposal}
            text={`${shareText}\nView on CharmVerse:\n`}
            content={{
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'bold'
                        }
                      ],
                      text: `Proposal: `
                    },
                    {
                      type: 'text',
                      text: shareText
                    }
                  ]
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `View on CharmVerse `
                    },
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'link',
                          attrs: {
                            href: `https://app.charmverse.io/${currentSpace?.domain}/${pagePath}`
                          }
                        }
                      ],
                      text: shareLink
                    }
                  ]
                }
              ]
            }}
            link={shareLink}
            readOnly={!user || !proposal.authors.map((a) => a.userId).includes(user.id)}
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
      <Modal open={showEditCredentials} onClose={() => setShowEditCredentials(false)} title='Edit proposal credentials'>
        <CredentialSelect
          templateType='proposal'
          selectedCredentialTemplates={proposal?.selectedCredentialTemplates ?? []}
          onChange={onChangeSelectedCredentialTemplates}
        />
      </Modal>
    </LoadingComponent>
  );
}
