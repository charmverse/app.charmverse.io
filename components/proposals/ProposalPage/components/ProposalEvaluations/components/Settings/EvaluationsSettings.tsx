import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Collapse } from '@mui/material';
import { useMemo } from 'react';

import { useGetProposalTemplate } from 'charmClient/hooks/proposals';
import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import LoadingComponent from 'components/common/LoadingComponent';
import { EvaluationStepRow } from 'components/common/WorkflowSidebar/components/EvaluationStepRow';
import { TemplateSelect } from 'components/common/WorkflowSidebar/components/TemplateSelect';
import { WorkflowSelect } from 'components/common/WorkflowSidebar/components/WorkflowSelect';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import type { ProposalPropertiesInput } from '../../../ProposalProperties/ProposalPropertiesBase';
import { PrivateEvaluation } from '../Review/components/PrivateEvaluation';

import type { ProposalEvaluationValues } from './components/EvaluationStepSettings';
import { EvaluationStepSettings } from './components/EvaluationStepSettings';
import { ProposalCredentialSettings } from './components/ProposalCredentialSettings';
import type { RewardSettingsProps } from './components/RewardSettings';
import { RewardSettings } from './components/RewardSettings';
import { RubricTemplatesButton } from './components/RubricTemplatesButton';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'fields' | 'evaluations' | 'workflowId' | 'selectedCredentialTemplates'>;
  isTemplate?: boolean;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  onChangeTemplate: (value: { id: string } | null) => void;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  onChangeRewardSettings?: RewardSettingsProps['onChange'];
  onChangeSelectedCredentialTemplates: (templateIds: string[]) => void;
  templateId?: string | null;
  isStructuredProposal: boolean;
  expanded: boolean;
};
export function EvaluationsSettings({
  proposal,
  isTemplate,
  onChangeEvaluation,
  readOnly,
  onChangeTemplate,
  onChangeWorkflow,
  onChangeRewardSettings,
  onChangeSelectedCredentialTemplates,
  templateId,
  expanded: expandedContainer,
  isStructuredProposal
}: Props) {
  const { data: proposalTemplate } = useGetProposalTemplate(templateId);
  const { proposalTemplates } = useProposalTemplates();
  const { mappedFeatures } = useSpaceFeatures();
  const isAdmin = useIsAdmin();
  const { space: currentSpace } = useCurrentSpace();
  const { openSettings } = useSettingsDialog();
  const { data: workflowOptions = [] } = useGetProposalWorkflows(currentSpace?.id);
  const templatePageOptions = useMemo(
    () =>
      (proposalTemplates || []).map((template) => ({
        id: template.proposalId,
        title: template.title
      })),
    [proposalTemplates]
  );

  // We need to provide all necessary data for the proposal. A private evaluation won't allow users to populate all workflow options
  const filteredWorkflowOptions = isTemplate
    ? workflowOptions
    : workflowOptions.filter((w) => !w.privateEvaluations || (!!proposal?.workflowId && proposal.workflowId === w.id));

  const isTemplateRequired = Boolean(currentSpace?.requireProposalTemplate);
  const showCredentials = isAdmin || !!proposal?.selectedCredentialTemplates?.length || !templateId;
  const readOnlyCredentials = !isAdmin && (readOnly || !!templateId);

  const showRewards = !!isTemplate && !!onChangeRewardSettings;
  return (
    <LoadingComponent isLoading={!proposal} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        {!isTemplate && (
          <TemplateSelect
            onChange={onChangeTemplate}
            options={templatePageOptions}
            required={isTemplateRequired}
            value={templateId}
          />
        )}
        <WorkflowSelect
          options={filteredWorkflowOptions}
          value={proposal?.workflowId}
          onChange={onChangeWorkflow}
          readOnly={!!templateId && !isAdmin}
          required
          addNewAction={() => {
            openSettings('proposals');
            // open the new workflow input after the settings dialog is open
            setTimeout(() => {
              const btnElement = document.getElementById('new-workflow-btn');
              btnElement?.click();
            }, 100);
          }}
          // only require confirmation change if rubric criteria have been set up
          // this may be extended in the future if we add other sophisticated evaluation configurations
          requireConfirmation={proposal?.evaluations.some(
            (e) => e.rubricCriteria.filter((criteria) => criteria.title).length
          )}
        />
      </Collapse>
      <EvaluationStepRow
        expanded={expandedContainer}
        expandedContainer={expandedContainer}
        index={0}
        result={null}
        title='Draft'
      />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => {
            // find matching template step, and allow editing if there were no reviewers set
            const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluation.title);
            const showRubricImport = evaluation.type === 'rubric' && !readOnly && !matchingTemplateStep;
            return (
              <EvaluationStepRow
                key={evaluation.id}
                expanded={expandedContainer}
                expandedContainer={expandedContainer}
                result={null}
                index={index + 1}
                title={evaluation.title}
                actions={
                  showRubricImport && (
                    <RubricTemplatesButton
                      excludeEvaluationId={evaluation.id}
                      onSelect={({ rubricCriteria }) => {
                        onChangeEvaluation?.(evaluation.id, { rubricCriteria });
                      }}
                    />
                  )
                }
              >
                {evaluation.type === 'private_evaluation' ? (
                  <PrivateEvaluation evaluation={evaluation} />
                ) : (
                  <EvaluationStepSettings
                    evaluation={evaluation}
                    evaluationTemplate={matchingTemplateStep}
                    readOnly={readOnly}
                    onChange={(updated) => {
                      onChangeEvaluation?.(evaluation.id, updated);
                    }}
                  />
                )}
              </EvaluationStepRow>
            );
          })}
          {showCredentials && (
            <Box mb={showRewards ? 0 : 8}>
              <EvaluationStepRow
                index={proposal ? proposal.evaluations.length + 1 : 0}
                result={null}
                title='Credentials'
                expanded={expandedContainer}
                expandedContainer={expandedContainer}
              >
                <ProposalCredentialSettings
                  readOnly={readOnlyCredentials}
                  selectedCredentialTemplates={proposal.selectedCredentialTemplates ?? []}
                  setSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
                />
              </EvaluationStepRow>
            </Box>
          )}
          {/* reward settings */}
          {showRewards && (
            <Box mb={8}>
              <EvaluationStepRow
                index={proposal ? proposal.evaluations.length + (showCredentials ? 2 : 1) : 0}
                result={null}
                title={mappedFeatures.rewards.title}
                expanded={expandedContainer}
                expandedContainer={expandedContainer}
              >
                {(proposal.fields?.enableRewards || !isStructuredProposal) && (
                  <RewardSettings value={proposal.fields} onChange={onChangeRewardSettings} />
                )}
              </EvaluationStepRow>
            </Box>
          )}
        </>
      )}
    </LoadingComponent>
  );
}
