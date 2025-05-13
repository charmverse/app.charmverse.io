import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Collapse } from '@mui/material';
import { useMemo } from 'react';

import { useGetProposalTemplate } from 'charmClient/hooks/proposals';
import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import LoadingComponent from 'components/common/LoadingComponent';
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
import { EvaluationStepSettingsRow } from './components/EvaluationStepSettingsRow';
import { ProposalCredentialSettings } from './components/ProposalCredentialSettings';
import type { RewardSettingsProps } from './components/RewardSettings';
import { RewardSettings } from './components/RewardSettings';
import { RubricTemplatesButton } from './components/RubricTemplatesButton';

export type Props = {
  proposal?: Pick<
    ProposalPropertiesInput,
    'fields' | 'evaluations' | 'workflowId' | 'selectedCredentialTemplates' | 'makeRewardsPublic'
  >;
  isTemplate?: boolean;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  onChangeTemplate: (value: { id: string } | null) => void;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  onChangeRewardSettings?: RewardSettingsProps['onChange'];
  onChangeSelectedCredentialTemplates: (templateIds: string[]) => void;
  templateId?: string | null;
  isStructuredProposal: boolean;
  expandedSidebar?: boolean;
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
  expandedSidebar,
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
        id: template.pageId,
        title: template.title
      })),
    [proposalTemplates]
  );

  const expanded = useMemo(() => {
    return expandedSidebar === false ? false : isTemplate || (!isTemplate && !templateId);
  }, [expandedSidebar]);

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
      <Collapse in={expandedSidebar}>
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
      <EvaluationStepSettingsRow
        key={String(expandedSidebar)}
        expandedSidebar={expandedSidebar}
        expanded={expanded}
        index={0}
        title='Draft'
      />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => {
            // find matching template step, and allow editing if there were no reviewers set
            const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluation.title);
            const showRubricImport = evaluation.type === 'rubric' && !readOnly && !matchingTemplateStep;
            return (
              <EvaluationStepSettingsRow
                key={`${String(expandedSidebar)}.${evaluation.id}`}
                expandedSidebar={expandedSidebar}
                expanded={expanded}
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
              </EvaluationStepSettingsRow>
            );
          })}
          {/* reward settings */}
          {showRewards && (
            <Box mb={showCredentials ? 0 : 8}>
              <EvaluationStepSettingsRow
                key={String(expandedSidebar)}
                expandedSidebar={expandedSidebar}
                index={proposal ? proposal.evaluations.length + 1 : 0}
                title={mappedFeatures.rewards.title}
                expanded={expanded}
              >
                {(proposal.fields?.enableRewards || !isStructuredProposal) && (
                  <RewardSettings value={proposal.fields} onChange={onChangeRewardSettings} />
                )}
              </EvaluationStepSettingsRow>
            </Box>
          )}
          {showCredentials && (
            <Box mb={8}>
              <EvaluationStepSettingsRow
                key={String(expandedSidebar)}
                expandedSidebar={expandedSidebar}
                index={proposal ? proposal.evaluations.length + (showRewards ? 2 : 1) : 0}
                title='Credentials'
                expanded={expanded}
              >
                <ProposalCredentialSettings
                  readOnly={readOnlyCredentials}
                  selectedCredentialTemplates={proposal.selectedCredentialTemplates ?? []}
                  setSelectedCredentialTemplates={onChangeSelectedCredentialTemplates}
                />
              </EvaluationStepSettingsRow>
            </Box>
          )}
        </>
      )}
    </LoadingComponent>
  );
}
