import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Chip, Stack, Switch, Typography, FormLabel } from '@mui/material';

import { useProposalTemplateById } from 'components/proposals/hooks/useProposalTemplates';
import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { EvaluationStepRow } from '../EvaluationSidebar/components/EvaluationStepRow';
import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';
import type { RewardSettingsProps } from './components/RewardSettings';
import { RewardSettings } from './components/RewardSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'fields' | 'evaluations' | 'workflowId'>;
  isTemplate?: boolean;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  isReviewer: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  onChangeRewardSettings?: RewardSettingsProps['onChange'];
  templateId?: string | null;
  isStructuredProposal: boolean;
  requireWorkflowChangeConfirmation?: boolean;
};

export function EvaluationSettingsSidebar({
  proposal,
  isTemplate,
  onChangeEvaluation,
  readOnly,
  onChangeWorkflow,
  onChangeRewardSettings,
  isReviewer,
  templateId,
  isStructuredProposal,
  requireWorkflowChangeConfirmation
}: Props) {
  const proposalTemplate = useProposalTemplateById(templateId);
  const { mappedFeatures } = useSpaceFeatures();
  const isAdmin = useIsAdmin();

  return (
    <div data-test='evaluation-settings-sidebar'>
      <WorkflowSelect
        value={proposal?.workflowId}
        onChange={onChangeWorkflow}
        readOnly={!!templateId && !isAdmin}
        required
        requireConfirmation={requireWorkflowChangeConfirmation}
      />
      <EvaluationStepRow index={0} result={null} title='Draft' />
      {proposal && (
        <>
          {proposal?.evaluations?.map((evaluation, index) => {
            // find matching template step, and allow editing if there were no reviewers set
            const matchingTemplateStep = proposalTemplate?.evaluations?.find((e) => e.title === evaluation.title);
            return (
              <EvaluationStepRow key={evaluation.id} expanded result={null} index={index + 1} title={evaluation.title}>
                <EvaluationStepSettings
                  evaluation={evaluation}
                  evaluationTemplate={matchingTemplateStep}
                  isReviewer={isReviewer}
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
                expanded
                actions={
                  isStructuredProposal && (
                    <Stack direction='row' alignItems='center' gap={1}>
                      {!proposal.fields?.enableRewards && <Chip label='Disabled' size='small' />}
                      {/* <Typography component='span' variant='subtitle1'>
                        Enabled
                      </Typography> */}
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
    </div>
  );
}
