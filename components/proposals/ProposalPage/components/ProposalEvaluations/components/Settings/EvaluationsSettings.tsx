import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Chip, Collapse, Stack, Switch } from '@mui/material';

import LoadingComponent from 'components/common/LoadingComponent';
import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/ProposalEvaluations/components/Settings/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { WorkflowSelect } from '../../../WorkflowSelect';
import { EvaluationStepRow } from '../Review/components/EvaluationStepRow';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';
import type { RewardSettingsProps } from './components/RewardSettings';
import { RewardSettings } from './components/RewardSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'fields' | 'evaluations' | 'workflowId'>;
  isTemplate?: boolean;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  onChangeRewardSettings?: RewardSettingsProps['onChange'];
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
  templateId,
  requireWorkflowChangeConfirmation,
  expanded: expandedContainer,
  isStructuredProposal
}: Props) {
  const proposalTemplate = useProposalTemplateById(templateId);
  const { mappedFeatures } = useSpaceFeatures();
  const isAdmin = useIsAdmin();
  return (
    <LoadingComponent isLoading={!proposal} data-test='evaluation-settings-sidebar'>
      <Collapse in={expandedContainer}>
        <WorkflowSelect
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
            return (
              <EvaluationStepRow
                key={evaluation.id}
                expanded={expandedContainer}
                expandedContainer={expandedContainer}
                result={null}
                index={index + 1}
                title={evaluation.title}
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
          {/* reward settings */}
          {isTemplate && onChangeRewardSettings && (
            <Box mb={8}>
              <EvaluationStepRow
                index={proposal ? proposal.evaluations.length + 1 : 0}
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
