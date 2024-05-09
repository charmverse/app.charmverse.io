import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, Divider, FormLabel, Stack, TextField, Typography } from '@mui/material';

import { useResetProposalReview, useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import UserDisplay from 'components/common/UserDisplay';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type Props = {
  hideReviewer?: boolean;
  proposalId?: string;
  evaluation: Pick<
    PopulatedEvaluation,
    'id' | 'completedAt' | 'reviewers' | 'result' | 'isReviewer' | 'actionLabels' | 'requiredReviews' | 'reviews'
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
  const { user } = useUser();
  const reviewerOptions = evaluation.reviewers.map((reviewer) => ({
    group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
    id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
  }));
  const { showConfirmation } = useConfirmationModal();
  const { showMessage } = useSnackbar();
  const currentUserEvaluationReview = evaluation.reviews?.find((review) => review.reviewerId === user?.id);
  const completedDate = evaluation.completedAt ? getRelativeTimeInThePast(new Date(evaluation.completedAt)) : null;
  const { trigger: resetProposalReview, isMutating: isResettingProposalReview } = useResetProposalReview({
    proposalId
  });

  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !evaluation.isReviewer
    ? 'You are not a reviewer'
    : isMutating
    ? 'Submitting review'
    : archived
    ? 'You cannot move an archived proposal'
    : null;

  const actionLabels = getActionButtonLabels(evaluation);
  const evaluationReviews = evaluation.reviews ?? [];
  const requiredReviews = evaluation.requiredReviews;
  const canReview =
    evaluation.isReviewer &&
    evaluationReviews.length < requiredReviews &&
    !evaluation.result &&
    !currentUserEvaluationReview;
  const totalPassed = evaluationReviews.filter((r) => r.result === 'pass').length;
  const totalFailed = evaluationReviews.filter((r) => r.result === 'fail').length;

  async function onSubmitReview(result: NonNullable<PopulatedEvaluation['result']>) {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: result === 'pass' ? actionLabels.approve : actionLabels.reject
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
          {requiredReviews !== 1 && (
            <Box className='octo-propertyrow' mb={2}>
              <Stack direction='row' justifyContent='space-between'>
                <FormLabel>
                  <Typography component='span' variant='subtitle1'>
                    Required reviews
                  </Typography>
                </FormLabel>
                <Typography component='span'>{requiredReviews}</Typography>
              </Stack>
            </Box>
          )}
          <FormLabel>
            <Typography variant='subtitle1'>Result</Typography>
          </FormLabel>
        </>
      )}
      <Card variant='outlined'>
        {evaluationReviews.length > 0 && (
          <>
            <Stack p={2} gap={2}>
              {evaluationReviews.map((evaluationReview, index) => (
                <Stack key={evaluationReview.id} direction='row' justifyContent='space-between' alignItems='center'>
                  <Stack direction='row' gap={1} alignItems='center'>
                    <Typography variant='body2'>{index + 1}.</Typography>
                    <UserDisplay userId={evaluationReview.reviewerId} avatarSize='xSmall' />
                    <Typography variant='subtitle1'>
                      {getRelativeTimeInThePast(new Date(evaluationReview.completedAt))}
                    </Typography>
                  </Stack>
                  <Stack direction='row' gap={1.5} alignItems='center'>
                    {evaluationReview.reviewerId === user?.id && !evaluation.result && (
                      <Button
                        size='small'
                        color='secondary'
                        variant='outlined'
                        loading={isResettingProposalReview}
                        onClick={() => {
                          resetProposalReview({
                            evaluationId: evaluation.id
                          }).then(refreshProposal);
                        }}
                      >
                        Reset
                      </Button>
                    )}
                    {evaluationReview.result === 'pass' ? (
                      <ApprovedIcon fontSize='small' color='success' />
                    ) : (
                      <RejectedIcon fontSize='small' color='error' />
                    )}
                  </Stack>
                </Stack>
              ))}
              <Divider />
              <Stack direction='row' gap={1}>
                <Typography variant='body2'>
                  Requires:{' '}
                  <Typography variant='body2' fontWeight='bold' component='span' color='secondary'>
                    {requiredReviews}
                  </Typography>
                </Typography>
                <Typography variant='body2'>
                  {actionLabels.approve}:{' '}
                  <Typography variant='body2' fontWeight='bold' component='span' color='success.main'>
                    {totalPassed}
                  </Typography>
                </Typography>
                <Typography variant='body2'>
                  {actionLabels.reject}:{' '}
                  <Typography variant='body2' component='span' fontWeight='bold' color='error'>
                    {totalFailed}
                  </Typography>
                </Typography>
              </Stack>
            </Stack>
            {(canReview || !!evaluation.result) && <Divider sx={{ mx: 2 }} />}
          </>
        )}
        {canReview && (
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
                {actionLabels.reject}
              </Button>
              <Button
                data-test='evaluation-pass-button'
                onClick={() => onSubmitReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='successPale'
              >
                {actionLabels.approve}
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
