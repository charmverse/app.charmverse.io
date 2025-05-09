import { Box, Typography } from '@mui/material';

import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from '@packages/lib/proposals/interfaces';

import { PassFailEvaluationContainer } from '../../PassFailEvaluationContainer';

type Props = {
  proposal: Pick<ProposalWithUsersAndRubric, 'id' | 'evaluations' | 'permissions' | 'status' | 'archived' | 'authors'>;
  evaluation: PopulatedEvaluation;
  isCurrent: boolean;
  refreshProposal: VoidFunction;
};

// the final decision for the rubric step
export function RubricDecision({ isCurrent, evaluation, refreshProposal, proposal }: Props) {
  return (
    <Box mx={2} mt={1}>
      <Typography variant='subtitle1' sx={{ mb: 1 }}>
        {evaluation.isApprover ? 'Submit results of this step' : 'Results of this step'}
      </Typography>

      <PassFailEvaluationContainer
        isCurrent={!!isCurrent}
        hideReviewer
        authors={proposal?.authors?.map((a) => a.userId) ?? []}
        archived={!!proposal?.archived}
        actionCompletesStep
        key='results'
        label='Submit results:'
        evaluation={evaluation}
        proposalId={proposal?.id}
        confirmationMessage='Please verify that all reviewers have submitted a response. This will submit the final review for this step.'
        refreshProposal={refreshProposal}
      />
    </Box>
  );
}
