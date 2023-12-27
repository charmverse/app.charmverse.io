import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { Box, Divider, Typography } from '@mui/material';

import type { ProposalEvaluationValues } from 'components/proposals/ProposalPage/components/EvaluationSettingsSidebar/components/EvaluationStepSettings';
import type { ProposalPropertiesInput } from 'components/proposals/ProposalPage/components/ProposalProperties/ProposalPropertiesBase';

import { WorkflowSelect } from '../WorkflowSelect';

import { EvaluationStepSettings } from './components/EvaluationStepSettings';

export type Props = {
  proposal?: Pick<ProposalPropertiesInput, 'categoryId' | 'evaluations' | 'workflowId'>;
  onChangeEvaluation?: (evaluationId: string, updated: Partial<ProposalEvaluationValues>) => void;
  readOnly: boolean;
  readOnlyReviewers: boolean;
  readOnlyRubricCriteria: boolean;
  onChangeWorkflow: (workflow: ProposalWorkflowTyped) => void;
  readOnlyWorkflowSelect?: boolean;
};

export function EvaluationSettingsSidebar({
  proposal,
  onChangeEvaluation,
  readOnly,
  readOnlyReviewers,
  readOnlyRubricCriteria,
  onChangeWorkflow,
  readOnlyWorkflowSelect
}: Props) {
  const evaluationsWithConfig = proposal?.evaluations.filter((e) => e.type !== 'feedback');

  return (
    <div>
      <WorkflowSelect
        value={proposal?.workflowId}
        onChange={onChangeWorkflow}
        readOnly={readOnlyWorkflowSelect}
        required
      />
      <Box display='flex' flex={1} flexDirection='column' data-test='evaluation-settings-sidebar'>
        {proposal &&
          evaluationsWithConfig?.map((evaluation) => (
            <Box key={evaluation.id}>
              <Divider sx={{ my: 1 }} />
              <EvaluationStepSettings
                categoryId={proposal.categoryId}
                readOnly={readOnly}
                readOnlyReviewers={readOnlyReviewers}
                readOnlyRubricCriteria={readOnlyRubricCriteria}
                evaluation={evaluation}
                onChange={(updated) => {
                  onChangeEvaluation?.(evaluation.id, updated);
                }}
              />
            </Box>
          ))}
        {proposal && evaluationsWithConfig?.length === 0 && (
          <Typography variant='body2' color='secondary'>
            No evaluations configured
          </Typography>
        )}
      </Box>
    </div>
  );
}
