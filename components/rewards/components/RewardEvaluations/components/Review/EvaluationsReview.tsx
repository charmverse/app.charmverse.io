import { Collapse, Divider, Tooltip } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/workflows/EvaluationStepRow';
import { SocialShareLinksStep } from 'components/common/workflows/SocialShare/SocialShareLinksStep';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageWithContent } from 'lib/pages';
import { getCurrentRewardEvaluation } from 'lib/rewards/getCurrentRewardEvaluation';
import type { RewardEvaluation } from 'lib/rewards/getRewardWorkflows';
import { getRewardWorkflowWithApplication } from 'lib/rewards/getRewardWorkflowWithApplication';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { getAbsolutePath } from 'lib/utils/browser';

import { SubmitStepSettings } from '../Settings/components/SubmitSettings';
import type { EvaluationSettingsProps } from '../Settings/EvaluationsSettings';

import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { PaymentStepReview } from './components/PaymentStepReview';
import { ReviewStepReview } from './components/ReviewStepReview';
import { RewardCredentials } from './components/RewardCredentials';

export type Props = Omit<
  EvaluationSettingsProps,
  'onChangeWorkflow' | 'requireWorkflowChangeConfirmation' | 'rewardInput'
> & {
  reward: RewardWithUsers;
  application?: ApplicationWithTransactions;
  refreshApplication?: VoidFunction;
  page: PageWithContent;
  refreshPage?: VoidFunction;
};

export function EvaluationsReview({
  application,
  reward,
  onChangeReward,
  expanded: expandedContainer,
  readOnly,
  refreshApplication,
  page,
  refreshPage
}: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = inferRewardWorkflow(workflowOptions, reward);
  const hasIssuableOnchainCredentials = !!(
    currentSpace?.useOnchainCredentials &&
    currentSpace?.credentialsWallet &&
    (application?.issuableOnchainCredentials ?? []).length > 0
  );

  const { currentEvaluation, updatedWorkflow } = useMemo(() => {
    const _updatedWorkflow = workflow
      ? getRewardWorkflowWithApplication({
          application,
          workflow,
          hasCredentials: reward.selectedCredentialTemplates.length > 0,
          hasIssuableOnchainCredentials
        })
      : workflow;

    const _currentEvaluation = _updatedWorkflow ? getCurrentRewardEvaluation(_updatedWorkflow) : null;

    return {
      updatedWorkflow: _updatedWorkflow,
      currentEvaluation: _currentEvaluation
    };
  }, [workflow, application, hasIssuableOnchainCredentials, reward.selectedCredentialTemplates.length]);

  const [expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(
    application ? currentEvaluation?.id : undefined
  );
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);
  const [tempRewardUpdates, setTempRewardUpdates] = useState<UpdateableRewardFields | null>(null);
  const { showMessage } = useSnackbar();
  const shareLink = getAbsolutePath(`/${page.path}`, currentSpace?.domain);
  const shareText = `Check out ${page.title} from ${currentSpace?.domain} on CharmVerse: `;

  useEffect(() => {
    if (currentEvaluation && application) {
      setExpandedEvaluationId(currentEvaluation.id);
    }
  }, [currentEvaluation, application]);

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
            expanded={expandedContainer ? evaluation.id === expandedEvaluationId : false}
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
              <PaymentStepReview application={application} reward={reward} refreshApplication={refreshApplication} />
            ) : evaluation.type === 'submit' ? (
              <SubmitStepSettings readOnly onChange={() => {}} rewardInput={reward} />
            ) : evaluation.type === 'credential' ? (
              <RewardCredentials
                selectedCredentialTemplates={reward.selectedCredentialTemplates}
                rewardId={reward.id}
                application={application}
                refreshApplication={refreshApplication}
              />
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
      {page && expandedContainer && (
        <>
          <Divider />
          <SocialShareLinksStep
            pageId={page.id}
            lensPostLink={page.lensPostLink}
            onPublish={refreshPage}
            text={shareText}
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
                      text: `Reward: `
                    },
                    {
                      type: 'text',
                      text: `Check out ${page.title} from ${currentSpace?.domain} on CharmVerse: `
                    },
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'link',
                          attrs: {
                            href: `https://app.charmverse.io/${currentSpace?.domain}/${page.path}`
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
            readOnly={readOnly}
          />
        </>
      )}
    </LoadingComponent>
  );
}
