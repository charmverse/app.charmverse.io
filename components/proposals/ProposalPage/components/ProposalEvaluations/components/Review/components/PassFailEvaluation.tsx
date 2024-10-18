import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ThumbUpOutlined as ApprovedIcon, HighlightOff as RejectedIcon } from '@mui/icons-material';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import { Box, Card, Chip, FormLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import Modal from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useUser } from 'hooks/useUser';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';
import type { PopulatedEvaluation } from 'lib/proposals/interfaces';
import { getRelativeTimeInThePast } from 'lib/utils/dates';

export type PassFailEvaluationProps = {
  isAppealProcess?: boolean;
  actionCompletesStep?: boolean;
  isLastStep?: boolean;
  confirmationMessage?: string;
  hideReviewer?: boolean;
  isCurrent: boolean;
  isReviewer?: boolean;
  isApprover?: boolean;
  archived?: boolean;
  label?: string;
  onSubmitEvaluationReview: (params: {
    declineReason: string | null;
    result: NonNullable<PopulatedEvaluation['result']>;
    declineMessage?: string;
  }) => Promise<void>;
  onResetEvaluationReview?: () => void;
  isResettingEvaluationReview: boolean;
  reviewerOptions: {
    group: string;
    id: string;
  }[];
  showReviewerIdentities: boolean;
  isSubmittingReview: boolean;
  evaluationReviews?: {
    id: string;
    reviewerId: string;
    declineReasons: string[];
    declineMessage?: string | null;
    result: ProposalEvaluationResult;
    completedAt: Date;
  }[];
  totalReviews: number;
  requiredReviews: number;
  evaluationResult?: PopulatedEvaluation['result'];
  declineReasonOptions: string[];
  completedAt?: Date | null;
  actionLabels?: PopulatedEvaluation['actionLabels'];
};

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(2)};
`;

export function PassFailEvaluation({
  isCurrent,
  isReviewer,
  isApprover,
  archived,
  onSubmitEvaluationReview,
  hideReviewer,
  showReviewerIdentities,
  reviewerOptions,
  isSubmittingReview,
  evaluationReviews = [],
  requiredReviews,
  evaluationResult,
  isResettingEvaluationReview,
  onResetEvaluationReview,
  declineReasonOptions,
  completedAt,
  label = 'Submit review:',
  totalReviews,
  actionLabels: _actionLabels,
  confirmationMessage,
  isAppealProcess,
  actionCompletesStep,
  isLastStep
}: PassFailEvaluationProps) {
  const { user } = useUser();
  const currentUserEvaluationReview = evaluationReviews?.find((review) => review.reviewerId === user?.id);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [evaluationReviewId, setEvaluationReviewId] = useState<string | null>(null);
  const [declineMessage, setDeclineMessage] = useState('');
  const declineReasonModalPopupState = usePopupState({ variant: 'dialog' });
  const disabledTooltip = !isCurrent
    ? 'This evaluation step is not active'
    : !actionCompletesStep && !isReviewer
      ? 'You are not a reviewer'
      : actionCompletesStep && !isApprover
        ? 'You are not an approver'
        : isSubmittingReview
          ? 'Submitting review'
          : archived
            ? 'You cannot move an archived proposal'
            : null;
  const completedDate = completedAt ? getRelativeTimeInThePast(new Date(completedAt)) : null;
  const evaluationReviewDeclineInputPopupState = usePopupState({ variant: 'popover' });

  const actionLabels = getActionButtonLabels({
    actionLabels: _actionLabels
  });
  const canReview = isReviewer && totalReviews < requiredReviews && !evaluationResult && !currentUserEvaluationReview;

  const canPassFail = (!actionCompletesStep && canReview) || (actionCompletesStep && isApprover);

  const { showConfirmation } = useConfirmationModal();
  const _onSubmitEvaluationReview = async (result: NonNullable<PopulatedEvaluation['result']>) => {
    if (confirmationMessage) {
      const { confirmed } = await showConfirmation({
        message: confirmationMessage,
        confirmButton: result === 'pass' ? actionLabels.approve : actionLabels.reject
      });
      if (!confirmed) {
        return;
      }
    }

    await onSubmitEvaluationReview({
      declineReason,
      result,
      declineMessage
    });
  };

  function onClose() {
    setDeclineReason(null);
    setDeclineMessage('');
    setEvaluationReviewId(null);
    declineReasonModalPopupState.close();
  }

  return (
    <>
      {!hideReviewer && (
        <>
          <Box mb={2}>
            <FormLabel>
              <Typography sx={{ mb: 1 }} variant='subtitle1'>
                {isAppealProcess ? 'Appeal Reviewers' : 'Reviewers'}
              </Typography>
            </FormLabel>
            <UserAndRoleSelect
              data-test='evaluation-reviewer-select'
              systemRoles={[allMembersSystemRole]}
              readOnly={true}
              wrapColumn
              value={reviewerOptions}
              onChange={() => {}}
              hideIdentity={!showReviewerIdentities}
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
        {evaluationReviews.length > 0 && (
          <Stack p={2} gap={2.5}>
            {evaluationReviews.map((evaluationReview, index) => {
              return (
                <Stack key={evaluationReview.id} gap={1.5}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack direction='row' gap={1} alignItems='center'>
                      <UserDisplay
                        userId={evaluationReview.reviewerId}
                        avatarSize='xSmall'
                        hideIdentity={!showReviewerIdentities}
                      />
                      <Typography variant='subtitle1'>
                        {getRelativeTimeInThePast(new Date(evaluationReview.completedAt))}
                      </Typography>
                    </Stack>
                    <Stack direction='row' gap={1.5} alignItems='center'>
                      {onResetEvaluationReview &&
                        evaluationReview.reviewerId === user?.id &&
                        // Only allow undoing review if its the last step
                        isLastStep && (
                          <Button
                            size='small'
                            color='secondary'
                            variant='outlined'
                            loading={isResettingEvaluationReview}
                            onClick={onResetEvaluationReview}
                          >
                            Undo
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
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Stack flexDirection='row' gap={1.5} width='calc(100% - 50px)'>
                        {evaluationReview.declineReasons.map((reason) => (
                          <Chip size='small' variant='outlined' key={reason} label={reason} sx={{ mr: 0.5 }} />
                        ))}
                      </Stack>
                      {evaluationReview.declineMessage && (
                        <Tooltip title='View additional comment'>
                          <div>
                            <CommentOutlinedIcon
                              sx={{
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setEvaluationReviewId(evaluationReview.id);
                                evaluationReviewDeclineInputPopupState.open();
                              }}
                              fontSize='small'
                              color='secondary'
                            />
                          </div>
                        </Tooltip>
                      )}
                    </Stack>
                  ) : null}
                </Stack>
              );
            })}
          </Stack>
        )}

        {canPassFail && (
          <Box display='flex' justifyContent='space-between' alignItems='center' p={2}>
            <FormLabel>
              <Typography component='span' variant='subtitle1'>
                {label}{' '}
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
        {!canPassFail && isCurrent && evaluationResult === null && (
          <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' py={2} px={2}>
            <Typography variant='body2'>{isAppealProcess ? 'Appeal' : 'Review'} process ongoing</Typography>
          </Stack>
        )}
        {evaluationResult === 'pass' && (
          <ResultsContainer>
            <ApprovedIcon color='success' />
            <Typography variant='body2'>Approved {completedDate}</Typography>
          </ResultsContainer>
        )}
        {evaluationResult === 'fail' && (
          <ResultsContainer>
            <RejectedIcon color='error' />
            <Typography variant='body2'>Declined {completedDate}</Typography>
          </ResultsContainer>
        )}
      </Card>
      <Modal open={!!declineReasonModalPopupState.isOpen} onClose={onClose} title='Reason for decline' size='small'>
        <Stack gap={1} mb={3}>
          <FormLabel required>Please select at least one reason for declining this proposal</FormLabel>
          <Select
            required
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

        <Stack gap={1}>
          <FormLabel required>Additional comment</FormLabel>
          <TextField
            multiline
            fullWidth
            required
            rows={5}
            onChange={(e) => {
              setDeclineMessage(e.target.value);
            }}
            value={declineMessage}
          />
        </Stack>

        <Box display='flex' justifyContent='flex-end' mt={3} gap={2}>
          <Button color='secondary' variant='outlined' onClick={onClose}>
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
              onClose();
            }}
            disabled={declineReason === null || !declineMessage}
          >
            {actionLabels.reject}
          </Button>
        </Box>
      </Modal>

      {evaluationReviewId && !!evaluationReviewDeclineInputPopupState.isOpen && (
        <Modal open onClose={onClose} title='Additional comment' size='small'>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={evaluationReviews.find((review) => review.id === evaluationReviewId)?.declineMessage}
            disabled
          />
        </Modal>
      )}
    </>
  );
}
