import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, Chip, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { useResetProposalReview, useSubmitEvaluationResult } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Modal from 'components/common/Modal';
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
    | 'id'
    | 'completedAt'
    | 'reviewers'
    | 'result'
    | 'isReviewer'
    | 'actionLabels'
    | 'requiredReviews'
    | 'reviews'
    | 'declineReasonOptions'
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
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const declineReasonModalPopupState = usePopupState({ variant: 'dialog' });
  const declineReasonOptions = evaluation.declineReasonOptions ?? [];

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
        result,
        declineReasons: declineReason ? [declineReason] : []
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
            <Typography variant='subtitle1'>
              Result{requiredReviews !== 1 ? ` (required ${requiredReviews})` : ''}
            </Typography>
          </FormLabel>
        </>
      )}
      <Card variant='outlined'>
        {requiredReviews !== 1 && evaluationReviews.length > 0 && (
          <Stack p={2} gap={2.5}>
            {evaluationReviews.map((evaluationReview) => (
              <Stack key={evaluationReview.id} gap={1}>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                  <Stack direction='row' gap={1} alignItems='center'>
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
                {evaluationReview.result === 'fail' && evaluationReview.declineReasons.length ? (
                  <Stack flexDirection='row' gap={1.5}>
                    {evaluationReview.declineReasons.map((reason) => (
                      <Chip size='small' variant='outlined' key={reason} label={reason} sx={{ mr: 0.5 }} />
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            ))}
          </Stack>
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
                onClick={() => {
                  if (declineReasonOptions.length) {
                    declineReasonModalPopupState.open();
                  } else {
                    onSubmitReview('fail');
                  }
                }}
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
      <Modal
        open={!!declineReasonModalPopupState.isOpen}
        onClose={() => {
          setDeclineReason(null);
          declineReasonModalPopupState.close();
        }}
        title='Reason for decline'
        size='small'
      >
        <Stack gap={1}>
          <Typography>Please select at least one reason for declining this proposal.</Typography>
          <Select
            value={declineReason}
            onChange={(e) => {
              setDeclineReason(e.target.value);
            }}
            renderValue={(selected) => <Chip size='small' variant='outlined' label={selected} sx={{ mr: 0.5 }} />}
          >
            {declineReasonOptions.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Box display='flex' justifyContent='flex-end' mt={3} gap={2}>
          <Button
            color='secondary'
            variant='outlined'
            onClick={() => {
              setDeclineReason(null);
              declineReasonModalPopupState.close();
            }}
          >
            Cancel
          </Button>
          <Button
            color='error'
            sx={{
              fontWeight: 'bold'
            }}
            loading={isMutating}
            data-testid='confirm-delete-button'
            onClick={async () => {
              await onSubmitReview('fail');
              setDeclineReason(null);
              declineReasonModalPopupState.close();
            }}
            disabled={declineReason === null}
          >
            {actionLabels.reject}
          </Button>
        </Box>
      </Modal>
    </>
  );
}
