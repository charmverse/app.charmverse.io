import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import { useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type Props = {
  hideReviewer?: boolean;
  proposalId?: string;
  evaluation: Pick<
    PopulatedEvaluation,
    'id' | 'completedAt' | 'reviewers' | 'result' | 'isReviewer' | 'actionButtonLabels'
  >;
  refreshProposal?: VoidFunction;
  confirmationMessage?: string;
  isCurrent: boolean;
  archived?: boolean;
};

export function PassFailEvaluation({
  proposalId,
  hideReviewer,
  evaluation,
  isCurrent,
  refreshProposal,
  confirmationMessage,
  archived
}: Props) {
  const { trigger, isMutating } = useSubmitEvaluationResult({ proposalId });

  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();

  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !evaluation.isReviewer
    ? 'You are not a reviewer'
    : isMutating
    ? 'Submitting review'
    : archived
    ? 'You cannot move an archived proposal'
    : null;

  const actionButtonLabels = evaluation?.actionButtonLabels as
    | undefined
    | {
        approve: string;
        decline: string;
      };

  const approveLabel = actionButtonLabels?.approve || 'Pass';
  const declineLabel = actionButtonLabels?.decline || 'Decline';

  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: result === 'pass' ? approveLabel : declineLabel
      });
      if (!confirmed) {
        return;
      }
    }
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
              value={reviewerOptions as SelectOption[]}
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
                data-test='evaluation-fail-button'
                onClick={() => onSubmitReview('fail')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='errorPale'
              >
                {declineLabel}
              </Button>
              <Button
                data-test='evaluation-pass-button'
                onClick={() => onSubmitReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='successPale'
              >
                {approveLabel}
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
