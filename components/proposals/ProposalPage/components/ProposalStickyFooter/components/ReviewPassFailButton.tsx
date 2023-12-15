import { Box, FormLabel, Typography } from '@mui/material';
import { useState } from 'react';

import { useUpdateProposalEvaluation } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation, ProposalWithUsersAndRubric } from 'lib/proposal/interface';

type PassFailResult = NonNullable<PopulatedEvaluation['result']>;

export type Props = {
  evaluationId?: string;
  proposalId?: string;
  refreshProposal?: VoidFunction;
};

export function ReviewPassFailButton({ proposalId, evaluationId, refreshProposal }: Props) {
  const { showMessage } = useSnackbar();
  const [selected, setSelected] = useState<PassFailResult | null>(null);
  const { trigger: updateProposalEvaluation, isMutating: isSaving } = useUpdateProposalEvaluation({ proposalId });
  async function onSubmitReview(result: PassFailResult) {
    try {
      setSelected(result);
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
    <Box display='flex' justifyContent='flex-end' alignItems='center' gap={2}>
      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Submit review:
        </Typography>
      </FormLabel>
      <Box display='flex' justifyContent='flex-end' gap={1}>
        <Button loading={selected === 'fail' && isSaving} onClick={() => onSubmitReview('fail')} color='error'>
          Decline
        </Button>
        <Button loading={selected === 'pass' && isSaving} onClick={() => onSubmitReview('pass')} color='success'>
          Pass
        </Button>
      </Box>
    </Box>
  );
}
