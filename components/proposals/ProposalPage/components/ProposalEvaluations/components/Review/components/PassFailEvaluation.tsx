import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, Chip, Divider, FormLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import {
  useAppealProposalEvaluation,
  useResetEvaluationAppealReview,
  useResetEvaluationReview,
  useSubmitEvaluationAppealReview,
  useSubmitEvaluationReview
} from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
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
  authors: string[];
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
    | 'appealable'
    | 'appealRequiredReviews'
    | 'appealReviewers'
    | 'type'
    | 'appealedAt'
  >;
  refreshProposal?: VoidFunction;
  confirmationMessage?: string;
  isCurrent: boolean;
  archived?: boolean;
};

function PassFailEvaluationReview({
  isCurrent,
  isReviewer,
  archived,
  onSubmitEvaluationReview,
  hideReviewer,
  reviewerOptions,
  isSubmittingReview,
  evaluationReviews = [],
  requiredReviews,
  evaluationResult,
  isResettingEvaluationReview,
  onResetEvaluationReview,
  declineReasonOptions,
  completedAt,
  actionLabels: _actionLabels,
  confirmationMessage
}: {
  confirmationMessage?: string;
  hideReviewer?: boolean;
  isCurrent: boolean;
  isReviewer?: boolean;
  archived?: boolean;
  onSubmitEvaluationReview: (
    declineReason: string | null,
    result: NonNullable<PopulatedEvaluation['result']>
  ) => Promise<void>;
  onResetEvaluationReview: () => void;
  isResettingEvaluationReview: boolean;
  reviewerOptions: {
    group: string;
    id: string;
  }[];
  isSubmittingReview: boolean;
  evaluationReviews: PopulatedEvaluation['reviews'];
  requiredReviews: number;
  evaluationResult?: PopulatedEvaluation['result'];
  declineReasonOptions: string[];
  completedAt?: Date | null;
  actionLabels?: PopulatedEvaluation['actionLabels'];
}) {
  const { user } = useUser();
  const currentUserEvaluationReview = evaluationReviews?.find((review) => review.reviewerId === user?.id);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const declineReasonModalPopupState = usePopupState({ variant: 'dialog' });
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !isReviewer
    ? 'You are not a reviewer'
    : isSubmittingReview
    ? 'Submitting review'
    : archived
    ? 'You cannot move an archived proposal'
    : null;
  const completedDate = completedAt ? getRelativeTimeInThePast(new Date(completedAt)) : null;

  const actionLabels = getActionButtonLabels({
    actionLabels: _actionLabels
  });
  const canReview =
    isReviewer && evaluationReviews.length < requiredReviews && !evaluationResult && !currentUserEvaluationReview;
  const { showConfirmation } = useConfirmationModal();

  const _onSubmitEvaluationReview = async (result: NonNullable<PopulatedEvaluation['result']>) => {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: actionLabels.reject
      });
      if (!confirmed) {
        return;
      }
    }

    await onSubmitEvaluationReview(declineReason, result);
  };

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
                    {evaluationReview.reviewerId === user?.id && !evaluationResult && (
                      <Button
                        size='small'
                        color='secondary'
                        variant='outlined'
                        loading={isResettingEvaluationReview}
                        onClick={onResetEvaluationReview}
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
                    _onSubmitEvaluationReview('fail');
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
                onClick={() => _onSubmitEvaluationReview('pass')}
                disabled={!!disabledTooltip}
                disabledTooltip={disabledTooltip}
                color='successPale'
              >
                {actionLabels.approve}
              </Button>
            </Box>
          </Box>
        )}
        {evaluationResult === 'pass' && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
            <ApprovedIcon color='success' />
            <Typography variant='body2'>Approved {completedDate}</Typography>
          </Stack>
        )}
        {evaluationResult === 'fail' && (
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
            loading={isResettingEvaluationReview || isSubmittingReview}
            data-testid='confirm-delete-button'
            onClick={async () => {
              await _onSubmitEvaluationReview('fail');
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

export function PassFailEvaluation({
  proposalId,
  hideReviewer,
  evaluation,
  isCurrent,
  refreshProposal,
  confirmationMessage,
  archived,
  authors
}: Props) {
  const { user } = useUser();
  const canAppeal =
    evaluation.appealable &&
    !evaluation.appealedAt &&
    isCurrent &&
    evaluation.result === 'fail' &&
    user &&
    authors.includes(user.id);
  const { trigger: submitEvaluationReview, isMutating: isSubmittingEvaluationReview } = useSubmitEvaluationReview({
    proposalId
  });
  const { trigger: submitEvaluationAppealReview, isMutating: isSubmittingEvaluationAppealReview } =
    useSubmitEvaluationAppealReview({ evaluationId: evaluation.id });
  const { trigger: resetEvaluationReview, isMutating: isResettingEvaluationReview } = useResetEvaluationReview({
    proposalId
  });
  const { trigger: resetEvaluationAppealReview, isMutating: isResettingEvaluationAppealReview } =
    useResetEvaluationAppealReview({
      evaluationId: evaluation.id
    });
  const { trigger: appealProposalEvaluation, isMutating: isAppealingProposalEvaluation } = useAppealProposalEvaluation({
    evaluationId: evaluation.id
  });

  const { showMessage } = useSnackbar();
  const actionLabels = getActionButtonLabels(evaluation);

  async function onSubmitEvaluationReview(
    declineReason: string | null,
    result: NonNullable<PopulatedEvaluation['result']>
  ) {
    try {
      await submitEvaluationReview({
        evaluationId: evaluation.id,
        result,
        declineReasons: declineReason ? [declineReason] : []
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  async function onSubmitEvaluationAppealReview(
    declineReason: string | null,
    result: NonNullable<PopulatedEvaluation['result']>
  ) {
    try {
      await submitEvaluationAppealReview({
        result,
        declineReasons: declineReason ? [declineReason] : []
      });
      refreshProposal?.();
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }

  async function onResetEvaluationAppealReview() {
    resetEvaluationAppealReview({
      evaluationId: evaluation.id
    }).then(refreshProposal);
  }

  function onResetEvaluationReview() {
    resetEvaluationReview({
      evaluationId: evaluation.id
    }).then(refreshProposal);
  }

  function onAppealProposalEvaluation() {
    appealProposalEvaluation().then(refreshProposal);
  }

  return (
    <>
      <PassFailEvaluationReview
        confirmationMessage={confirmationMessage}
        hideReviewer={hideReviewer}
        isCurrent={isCurrent}
        isReviewer={evaluation.isReviewer}
        archived={archived}
        onSubmitEvaluationReview={onSubmitEvaluationReview}
        onResetEvaluationReview={onResetEvaluationReview}
        isResettingEvaluationReview={isResettingEvaluationReview}
        reviewerOptions={evaluation.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
          id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
        }))}
        isSubmittingReview={isSubmittingEvaluationReview}
        evaluationReviews={evaluation.reviews?.filter((review) => !review.appeal)}
        requiredReviews={evaluation.requiredReviews}
        evaluationResult={evaluation.result}
        declineReasonOptions={evaluation.declineReasonOptions}
        completedAt={evaluation.completedAt}
        actionLabels={actionLabels}
      />
      {canAppeal ? (
        <Button
          sx={{
            my: 2
          }}
          onClick={onAppealProposalEvaluation}
          loading={isAppealingProposalEvaluation}
        >
          Appeal
        </Button>
      ) : null}
      {evaluation.appealedAt && (
        <>
          <Divider
            sx={{
              my: 2
            }}
          />
          <Typography variant='h6'>Appeal</Typography>
          <PassFailEvaluationReview
            isCurrent={isCurrent}
            isReviewer={evaluation.isReviewer}
            archived={archived}
            onSubmitEvaluationReview={onSubmitEvaluationAppealReview}
            onResetEvaluationReview={onResetEvaluationAppealReview}
            isResettingEvaluationReview={isResettingEvaluationAppealReview}
            reviewerOptions={
              evaluation.appealReviewers?.map((reviewer) => ({
                group: reviewer.roleId ? 'role' : reviewer.userId ? 'user' : 'system_role',
                id: (reviewer.roleId ?? reviewer.userId ?? reviewer.systemRole) as string
              })) ?? []
            }
            isSubmittingReview={isSubmittingEvaluationAppealReview}
            evaluationReviews={evaluation.reviews?.filter((review) => Boolean(review.appeal))}
            requiredReviews={evaluation.appealRequiredReviews ?? 1}
            declineReasonOptions={evaluation.declineReasonOptions}
            actionLabels={actionLabels}
          />
        </>
      )}
    </>
  );
}
