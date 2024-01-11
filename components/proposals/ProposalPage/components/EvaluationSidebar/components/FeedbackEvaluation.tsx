import { Box, Card, Stack, Typography } from '@mui/material';

import { useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from 'lib/proposal/interface';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

export type Props = {
  proposalId?: string;
  evaluation: Pick<PopulatedEvaluation, 'id' | 'completedAt' | 'reviewers' | 'result' | 'title'>;
  isCurrent: boolean;
  hasMovePermission: boolean;
  nextStep?: { title: string };
  onSubmit?: VoidFunction;
  archived?: boolean;
};

export function FeedbackEvaluation({
  hasMovePermission,
  proposalId,
  evaluation,
  isCurrent,
  nextStep,
  onSubmit,
  archived
}: Props) {
  const { showMessage } = useSnackbar();
  const { trigger, isMutating } = useSubmitEvaluationResult({ proposalId });

  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !hasMovePermission
    ? 'You do not have permission to move this proposal'
    : archived
    ? 'You cannot move an archived proposal'
    : null;

  async function onMoveForward() {
    try {
      await trigger({
        evaluationId: evaluation.id,
        result: 'pass'
      });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }

  return (
    <>
      {/* <Card variant='outlined'> */}
      {!evaluation.result && (
        <Box display='flex' justifyContent='flex-end' alignItems='center'>
          <Button
            loading={isMutating}
            onClick={onMoveForward}
            disabled={!!disabledTooltip}
            disabledTooltip={disabledTooltip}
          >
            {nextStep ? `Move to ${nextStep.title}` : `Complete ${evaluation.title}`}
          </Button>
        </Box>
      )}
      {evaluation.result && (
        <Card variant='outlined'>
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <Typography variant='body2'>Completed {completedDate}</Typography>
          </Stack>
        </Card>
      )}
    </>
  );
}
