import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Chip, Collapse, Stack, Switch } from '@mui/material';

import { useGetProposalTemplate } from 'charmClient/hooks/proposals';
import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import LoadingComponent from 'components/common/LoadingComponent';
import { WorkflowSelect } from 'components/common/workflows/WorkflowSelect';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { EvaluationStepRow } from '../../../../../../common/workflows/EvaluationStepRow';

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
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  onChangeRewardSettings?: RewardSettingsProps['onChange'];
  onChangeSelectedCredentialTemplates: (templateIds: string[]) => void;
  templateId?: string | null;
  isStructuredProposal: boolean;
  requireWorkflowChangeConfirmation?: boolean;
  expanded: boolean;
};

export function EvaluationsSettings({
  proposal,
  isTemplate,
  onChangeEvaluation,
  readOnly,
  onChangeWorkflow,
  onChangeRewardSettings,
  onChangeSelectedCredentialTemplates,
  templateId,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer,
  isStructuredProposal
}: Props) {
  const { data: proposalTemplate } = useGetProposalTemplate(templateId);
  const { mappedFeatures } = useSpaceFeatures();
  const isAdmin = useIsAdmin();

  const showCredentials = isAdmin || !!proposal?.selectedCredentialTemplates?.length;
  const readOnlyCredentials = !isAdmin;
  const { space: currentSpace } = useCurrentSpace();
  const { data: workflowOptions = [] } = useGetProposalWorkflows(currentSpace?.id);

  const showRewards = !!isTemplate && !!onChangeRewardSettings;
  return (
    <LoadingComponent isLoading={!proposal} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
          options={workflowOptions}
          value={proposal?.workflowId}
          onChange={onChangeWorkflow}
          readOnly={!!templateId && !isAdmin}
          required
          requireConfirmation={requireWorkflowChangeConfirmation}
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
                <EvaluationStepSettings
                  evaluation={evaluation}
                  evaluationTemplate={matchingTemplateStep}
                  readOnly={readOnly}
                  onChange={(updated) => {
                    onChangeEvaluation?.(evaluation.id, updated);
                  }}
                />
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
                actions={
                  isStructuredProposal && (
                    <Stack direction='row' alignItems='center' gap={1}>
                      {!proposal.fields?.enableRewards && <Chip label='Disabled' size='small' />}
                      <Switch
                        checked={proposal.fields?.enableRewards}
                        onChange={(e, checked) => onChangeRewardSettings({ enableRewards: checked })}
                      />
                    </Stack>
                  )
                }
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
