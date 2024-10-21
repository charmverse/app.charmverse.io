import type { KycOption, PersonaUserKycStatus, SynapsUserKycStatus } from '@charmverse/core/prisma-client';
import { Collapse, Divider, Tooltip } from '@mui/material';
import cloneDeep from 'lodash/cloneDeep';
import { useEffect, useMemo, useState } from 'react';

import { useGetPersonaInquiry, useGetSynapsSession } from 'charmClient/hooks/kyc';
import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/WorkflowSidebar/components/EvaluationStepRow';
import { SocialShareLinksStep } from 'components/common/WorkflowSidebar/components/SocialShareLinksStep/SocialShareLinksStep';
import { WorkflowSelect } from 'components/common/WorkflowSidebar/components/WorkflowSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageWithContent } from 'lib/pages';
import type { RewardFields } from 'lib/rewards/blocks/interfaces';
import { getCurrentRewardEvaluation } from 'lib/rewards/getCurrentRewardEvaluation';
import type { RewardEvaluation } from 'lib/rewards/getRewardWorkflows';
import { getRewardWorkflowWithApplication } from 'lib/rewards/getRewardWorkflowWithApplication';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { getAbsolutePath } from 'lib/utils/browser';

import { KycStepSettings } from '../Settings/components/KycStepSettings';
import type { EvaluationSettingsProps } from '../Settings/EvaluationsSettings';

import { CredentialsStepReview } from './components/CredentialsStepReview';
import { EvaluationStepActions } from './components/EvaluationStepActions';
import { EvaluationStepSettingsModal } from './components/EvaluationStepSettingsModal';
import { PaymentStepReview } from './components/PaymentStepReview';
import { ReviewStepReview } from './components/ReviewStepReview';
import { SubmitStepReview } from './components/SubmitStepReview';

export type Props = Pick<EvaluationSettingsProps, 'isTemplate' | 'onChangeReward' | 'expanded' | 'readOnly'> & {
  reward: RewardWithUsers;
  application?: ApplicationWithTransactions;
  refreshApplication?: VoidFunction;
  page: PageWithContent;
  refreshReward?: VoidFunction;
  isNewApplication?: boolean;
  templateId: string | null | undefined;
};

export function EvaluationsReview({
  application,
  reward,
  isTemplate,
  templateId,
  onChangeReward,
  expanded: expandedContainer,
  readOnly,
  refreshApplication,
  page,
  refreshReward,
  isNewApplication
}: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetRewardWorkflows(currentSpace?.id);
  const workflow = reward.fields ? inferRewardWorkflow(workflowOptions, reward.fields as RewardFields) : null;
  const hasIssuableOnchainCredentials = !!(
    currentSpace?.useOnchainCredentials &&
    currentSpace?.credentialsWallet &&
    (application?.issuableOnchainCredentials ?? []).length > 0
  );
  const { data: userSynapsSession } = useGetSynapsSession(
    currentSpace?.kycOption === 'synaps' ? currentSpace?.id : null,
    application?.createdBy
  );
  const { data: userPersonaSession } = useGetPersonaInquiry(
    currentSpace?.kycOption === 'persona' ? currentSpace?.id : null,
    application?.createdBy
  );

  const kycStatus = getKycStatus(
    currentSpace?.kycOption,
    currentSpace?.kycOption === 'synaps' ? userSynapsSession?.status : userPersonaSession?.status
  );

  const { currentEvaluation, updatedWorkflow } = useMemo(() => {
    const _updatedWorkflow = workflow
      ? getRewardWorkflowWithApplication({
          applicationStatus: application?.status,
          workflow,
          hasCredentials: reward.selectedCredentialTemplates.length > 0,
          hasIssuableOnchainCredentials,
          kycStatus
        })
      : workflow;

    const _currentEvaluation = _updatedWorkflow ? getCurrentRewardEvaluation(_updatedWorkflow) : null;

    return {
      updatedWorkflow: _updatedWorkflow,
      currentEvaluation: _currentEvaluation
    };
  }, [workflow, application, hasIssuableOnchainCredentials, reward.selectedCredentialTemplates.length, kycStatus]);

  const [expandedEvaluationId, setExpandedEvaluationId] = useState<string | undefined>(
    application || isNewApplication ? currentEvaluation?.id : undefined
  );
  const [evaluationInput, setEvaluationInput] = useState<RewardEvaluation | null>(null);
  const [tempRewardUpdates, setTempRewardUpdates] = useState<UpdateableRewardFields | null>(null);
  const { showMessage } = useSnackbar();
  const shareLink = getAbsolutePath(`/${page.path}`, currentSpace?.domain);
  const shareText = `Check out ${page.title} from ${currentSpace?.domain} on CharmVerse: `;

  useEffect(() => {
    if (currentEvaluation && (application || isNewApplication)) {
      setExpandedEvaluationId(currentEvaluation.id);
    }
  }, [currentEvaluation, application, isNewApplication]);

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
        const isCurrent = application || isNewApplication ? currentEvaluation?.id === evaluation.id : false;
        return (
          <EvaluationStepRow
            key={evaluation.id}
            expanded={expandedContainer ? evaluation.id === expandedEvaluationId : false}
            expandedContainer={expandedContainer}
            isCurrent={isCurrent}
            onChange={(e, expand) => setExpandedEvaluationId(expand ? evaluation.id : undefined)}
            index={index}
            title={evaluation.title}
            result={application ? (evaluation.result ?? null) : null}
            actions={
              evaluation.type === 'apply' || evaluation.type === 'kyc' || readOnly ? null : (
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
              <PaymentStepReview
                application={application}
                hidePaymentButton={!isCurrent}
                reward={reward}
                refreshApplication={refreshApplication}
              />
            ) : evaluation.type === 'kyc' ? (
              <KycStepSettings
                readOnly={!application || (!isCurrent && evaluation.result === null)}
                userId={application?.createdBy}
              />
            ) : evaluation.type === 'submit' ? (
              <SubmitStepReview reward={reward} />
            ) : evaluation.type === 'credential' ? (
              <CredentialsStepReview
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
          isTemplate={isTemplate}
          saveEvaluation={saveEvaluation}
          updateEvaluation={updateEvaluation}
          templateId={templateId}
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
            lensPostLink={reward.lensPostLink}
            onPublish={refreshReward}
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

function getKycStatus<T extends KycOption>(
  kycOption?: T | null,
  status?: T extends 'persona' ? SynapsUserKycStatus : PersonaUserKycStatus
) {
  if (kycOption === 'synaps') {
    if (status === 'APPROVED') {
      return true;
    } else if (status === 'REJECTED') {
      return false;
    } else {
      return null;
    }
  } else if (kycOption === 'persona') {
    if (status === 'completed') {
      return true;
    } else if (status === 'failed') {
      return false;
    } else {
      return null;
    }
  }
  return null;
}
