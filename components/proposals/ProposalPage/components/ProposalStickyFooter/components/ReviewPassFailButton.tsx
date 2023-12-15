import { Box, FormLabel, Typography } from '@mui/material';

import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation, ProposalWithUsersAndRubric } from 'lib/proposal/interface';

export type Props = {
  evaluationId?: string;
  proposalId?: string;
  refreshProposal?: VoidFunction;
};

export function ReviewPassFailButton({ proposalId, evaluationId, refreshProposal }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalEvaluation } = useUpdateProposalEvaluation({ proposalId });
  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    try {
      await updateProposalEvaluation({
        evaluationId,
        result
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Submit your review:
        </Typography>
      </FormLabel>
      <Box display='flex' justifyContent='flex-end' gap={1}>
        <Button onClick={() => onSubmitReview('fail')} color='error'>
          Reject
        </Button>
        <Button onClick={() => onSubmitReview('pass')} color='success'>
          Pass
        </Button>
      </Box>
    </Box>
  );
}
