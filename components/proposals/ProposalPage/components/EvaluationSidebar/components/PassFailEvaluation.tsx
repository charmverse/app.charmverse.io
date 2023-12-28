import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import { useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { Button } from 'components/common/Button';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from 'lib/proposal/interface';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

export type Props = {
  hideReviewer?: boolean;
  proposalId?: string;
  isReviewer?: boolean;
  evaluation: Pick<PopulatedEvaluation, 'id' | 'completedAt' | 'reviewers' | 'result'>;
  refreshProposal?: VoidFunction;
  isCurrent: boolean;
};

export function PassFailEvaluation({
  proposalId,
  hideReviewer,
  isReviewer,
  evaluation,
  isCurrent,
  refreshProposal
}: Props) {
  const { trigger } = useSubmitEvaluationResult({ proposalId });

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));
  const { showMessage } = useSnackbar();

  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !isReviewer
    ? 'You are not a reviewer'
    : null;

  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    try {
      await trigger({
        evaluationId: evaluation.id,
        result
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  return (
    <>
      {!hideReviewer && (
        <>
          <Box mb={2}>
            <FormLabel>
              <Typography sx={{ mb: 1 }} variant='subtitle1'>
                Reviewers
              </Typography>
            </FormLabel>
            <UserAndRoleSelect
              data-test='evaluation-reviewer-select'
              systemRoles={[allMembersSystemRole]}
              readOnly={true}
              value={reviewerOptions}
              onChange={() => {}}
            />
          </Box>
          <FormLabel>
            <Typography variant='subtitle1'>Result</Typography>
          </FormLabel>
        </>
      )}
      <Card variant='outlined'>
        {!evaluation.result && (
          <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                Submit review:
              </Typography>
            </FormLabel>
            <Box display='flex' justifyContent='flex-end' gap={1}>
              <Button
                onClick={() => onSubmitReview('fail')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='error'
              >
                Decline
              </Button>
              <Button
                onClick={() => onSubmitReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='success'
              >
                Pass
              </Button>
            </Box>
          </Box>
        )}
        {evaluation.result === 'pass' && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <ApprovedIcon color='success' />
            <Typography variant='body2'>Approved {completedDate}</Typography>
          </Stack>
        )}
        {evaluation.result === 'fail' && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <RejectedIcon color='error' />
            <Typography variant='body2'>Declined {completedDate}</Typography>
          </Stack>
        )}
      </Card>
    </>
  );
}
